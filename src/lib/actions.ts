"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { processFile, processUrl } from "@/lib/documentProcessor";
import { randomBytes } from "crypto";
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// MOTOR DE ESCALAMIENTO
export async function runEscalationLogic() {
  const limiteHoras = 72; // <-- De vuelta a 72 horas
  const ahora = new Date();
  const fechaLimite = new Date(ahora.getTime() - (limiteHoras * 60 * 60 * 1000));

  const expirados = await prisma.ticket.findMany({
    where: {
      status: "PENDIENTE",
      createdAt: { lt: fechaLimite },
      NOT: { type: "SOPORTE_TECNICO" } // <-- Volvemos a proteger el Soporte Técnico
    }
  });

  if (expirados.length > 0) {
    for (const ticket of expirados) {
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { status: "NO ATENDIDO EN TIEMPO" }
      });
    }
  }
}

export async function verifyDirectorPin(pin: string) {
  return pin === process.env.DIRECTOR_PIN;
}

export async function createTicket(formData: FormData): Promise<{ success: boolean; folio: string }> {
  const type = formData.get("type") as string;
  const category = formData.get("category") as string;
  const content = formData.get("content") as string;
  const studentName = formData.get("studentName") as string;
  const studentEmail = formData.get("studentEmail") as string;
  const files = formData.getAll("evidence"); 

  if (!content || !type) return { success: false, folio: "" };
  const folio = `ETH-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const attachmentLinks: string[] = [];

  try {
    const ticket = await prisma.ticket.create({
      data: { folio, type, category, content, studentName: studentName || "Anónimo Protegido", studentEmail: studentEmail || null, status: "PENDIENTE" },
    });

    if (supabase && files.length > 0) {
      for (const file of files) {
        const f = file as any;
        if (f.size > 0) {
          const cleanName = f.name.replace(/[^a-zA-Z0-9.]/g, "_");
          const fileName = `student/${ticket.id}-${Date.now()}-${cleanName}`;
          const arrayBuffer = await f.arrayBuffer();
          const { error } = await supabase.storage.from('evidencias').upload(fileName, Buffer.from(arrayBuffer), { contentType: f.type, upsert: true });
          if (!error) {
            const { data: { publicUrl } } = supabase.storage.from('evidencias').getPublicUrl(fileName);
            attachmentLinks.push(publicUrl);
            await prisma.attachment.create({ data: { url: publicUrl, name: f.name, type: "STUDENT", ticketId: ticket.id } });
          }
        }
      }
    }

    // 1. CORREO PARA LA AUTORIDAD
    let emailDestino = process.env.EMAIL_INGENIERO;
    const criterio = type === "SOPORTE_TECNICO" ? "SOPORTE_TECNICO" : category;
    if (criterio === "ACADEMICO") emailDestino = process.env.EMAIL_SECRETARIA_ACADEMICA;
    else if (criterio === "LOGISTICA") emailDestino = process.env.EMAIL_SECRETARIA_ADMINISTRATIVA;
    else if (criterio === "GRAVE") emailDestino = process.env.EMAIL_DIRECCION;

    if (process.env.RESEND_API_KEY && emailDestino) {
      const responderUrl = `https://master-chatbot-rho.vercel.app/admin/responder?folio=${folio}`;
      const listaEvidencias = attachmentLinks.length > 0 
        ? `<p><strong>Evidencias:</strong></p><ul>${attachmentLinks.map(l => `<li><a href="${l}">Ver archivo</a></li>`).join('')}</ul>`
        : '';

      await resend.emails.send({
        from: 'Buzon Etico <onboarding@resend.dev>',
        to: [emailDestino as string],
        subject: `[72h Plazo] Nuevo Reporte: ${folio}`,
        html: `<div style="font-family:sans-serif;padding:20px;border:1px solid #eee;border-radius:15px;">
                <h2>Reporte Recibido</h2>
                <p><strong>Folio:</strong> ${folio}</p>
                <blockquote style="background:#f9f9f9;padding:15px;border-left:5px solid #10b981;">${content}</blockquote>
                ${listaEvidencias}
                <br/><a href="${responderUrl}" style="background:#000;color:#fff;padding:12px 25px;text-decoration:none;border-radius:10px;">Atender Ahora</a>
               </div>`
      }).catch(e => console.error(e));
    }

    // 2. CORREO PARA EL ALUMNO (Tu idea, hermano)
    if (process.env.RESEND_API_KEY && studentEmail) {
      await resend.emails.send({
        from: 'Buzon Etico <onboarding@resend.dev>',
        to: [studentEmail as string],
        subject: `Confirmación de Reporte: ${folio}`,
        html: `<div style="font-family:sans-serif;padding:20px;border:1px solid #eee;border-radius:15px;">
                <h2 style="color:#10b981;">Tu voz ha sido registrada</h2>
                <p>Hola, <strong>${studentName || 'Anónimo'}</strong>. Hemos recibido tu reporte correctamente.</p>
                <div style="background:#f0fdf4;padding:20px;border-radius:10px;text-align:center;margin:20px 0;">
                  <p style="margin:0;font-size:12px;color:#166534;text-transform:uppercase;font-weight:bold;">Tu Folio de Seguimiento</p>
                  <p style="margin:5px 0 0 0;font-size:32px;font-weight:black;letter-spacing:-1px;">${folio}</p>
                </div>
                <p>Puedes consultar el estatus de tu solicitud en cualquier momento usando este folio en nuestro portal.</p>
                <br/><a href="https://master-chatbot-rho.vercel.app/seguimiento" style="background:#10b981;color:#fff;padding:12px 25px;text-decoration:none;border-radius:10px;font-weight:bold;">Ir a Seguimiento</a>
               </div>`
      }).catch(e => console.error(e));
    }

    revalidatePath("/admin/buzon");
    return { success: true, folio: ticket.folio };
  } catch (error) { return { success: false, folio: "" }; }
}

export async function submitAppeal(id: string, reason: string) {
  try {
    const currentTicket = await prisma.ticket.findUnique({ where: { id } });
    const newHistory = `[RESPUESTA DE AUTORIDAD]: ${currentTicket?.authorityResponse || 'Sin respuesta'}\n\n[RAZÓN DE APELACIÓN]: ${reason}`;
    const updated = await prisma.ticket.update({ where: { id }, data: { status: "APELADO", authorityResponse: newHistory } });

    let emailDestino = process.env.EMAIL_INGENIERO;
    if (updated.category === "ACADEMICO") emailDestino = process.env.EMAIL_SECRETARIA_ACADEMICA;
    else if (updated.category === "LOGISTICA") emailDestino = process.env.EMAIL_SECRETARIA_ADMINISTRATIVA;
    else if (updated.category === "GRAVE") emailDestino = process.env.EMAIL_DIRECCION;

    if (process.env.RESEND_API_KEY && emailDestino) {
      await resend.emails.send({
        from: 'Buzon Etico <onboarding@resend.dev>',
        to: [emailDestino as string],
        subject: `🚨 APELACIÓN: ${updated.folio}`,
        html: `<h2>Inconformidad recibida</h2><p>Folio: ${updated.folio}</p><p>Motivo: ${reason}</p>`
      }).catch(e => console.error(e));
    }
    revalidatePath("/seguimiento"); revalidatePath("/admin/buzon"); return { success: true };
  } catch (error) { return { success: false }; }
}

export async function setStudentSatisfaction(id: string, satisfied: boolean) {
  try {
    await prisma.ticket.update({ where: { id }, data: { studentResolved: satisfied } });
    revalidatePath("/seguimiento"); return { success: true };
  } catch (error) { return { success: false }; }
}

export async function submitAuthorityResponse(formData: FormData) {
  const id = formData.get("id") as string;
  const responseText = formData.get("responseText") as string;
  const files = formData.getAll("evidence");
  try {
    const updatedTicket = await prisma.ticket.update({ where: { id }, data: { authorityResponse: responseText, status: "RESUELTO", updatedAt: new Date() } });
    if (supabase && files.length > 0) {
      for (const file of files) {
        const f = file as any;
        if (f.size > 0) {
          const fileName = `authority/${id}-${Date.now()}-${f.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
          const arrayBuffer = await f.arrayBuffer();
          await supabase.storage.from('evidencias').upload(fileName, Buffer.from(arrayBuffer), { contentType: f.type, upsert: true });
          const { data: { publicUrl } } = supabase.storage.from('evidencias').getPublicUrl(fileName);
          await prisma.attachment.create({ data: { url: publicUrl, name: f.name, type: "AUTHORITY", ticketId: id } });
        }
      }
    }
    revalidatePath("/admin/buzon"); revalidatePath("/seguimiento"); revalidatePath("/admin/directora"); return { success: true };
  } catch (error) { return { success: false }; }
}

export async function updateTicketStatus(id: string, newStatus: string) {
  await prisma.ticket.update({ where: { id }, data: { status: newStatus } });
  revalidatePath("/admin/buzon"); revalidatePath("/admin/directora");
}

export async function createGroup(formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  await prisma.group.create({ data: { name, description } });
  revalidatePath("/admin/groups");
}
export async function updateGroup(formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  await prisma.group.update({ where: { id }, data: { name, description } });
  revalidatePath("/admin/groups");
}
export async function deleteGroup(id: string) {
  await prisma.group.delete({ where: { id } });
  revalidatePath("/admin/groups");
}
export async function createChatbot(formData: FormData) {
  const name = formData.get("name") as string;
  const groupId = formData.get("groupId") as string;
  const kbId = formData.get("knowledgeBaseId") as string;
  const token = randomBytes(4).toString("hex");
  await prisma.chatbot.create({ data: { name, token, groupId, knowledgeBaseId: kbId, isActive: true } });
  revalidatePath("/admin/chatbots");
}
export async function updateChatbot(formData: FormData) {
  const id = formData.get("id") as string;
  const updateData: any = {};
  ["name", "welcomeMessage", "systemInstructions", "inputPlaceholder", "fallbackMessage", "infoMessage", "logoUrl"].forEach(f => {
    const v = formData.get(f); if (v !== null) updateData[f] = v as string;
  });
  const isActive = formData.get("isActive");
  if (isActive !== null) updateData.isActive = isActive === "true";
  await prisma.chatbot.update({ where: { id }, data: updateData });
  revalidatePath("/admin/chatbots");
}
export async function deleteChatbot(id: string) {
  await prisma.chatbot.delete({ where: { id } });
  revalidatePath("/admin/chatbots");
}
export async function createKnowledgeBase(formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  await prisma.knowledgeBase.create({ data: { name, description } });
  revalidatePath("/admin/knowledge");
}
export async function updateKnowledgeBase(formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  await prisma.knowledgeBase.update({ where: { id }, data: { name, description } });
  revalidatePath("/admin/knowledge");
}
export async function deleteKnowledgeBase(id: string) {
  await prisma.knowledgeBase.delete({ where: { id } });
  revalidatePath("/admin/knowledge");
}
export async function uploadFileDocument(formData: FormData) {
  const file = formData.get("file") as File;
  const kbId = formData.get("knowledgeBaseId") as string;
  if (!file || !kbId) return;
  const buffer = Buffer.from(await file.arrayBuffer());
  const doc = await prisma.document.create({ data: { filename: file.name, type: "PDF", knowledgeBaseId: kbId } });
  await processFile(buffer, file.name, "PDF", kbId, doc.id);
  revalidatePath(`/admin/knowledge/${kbId}`);
}
export async function deleteDocument(id: string, kbId: string) {
  await prisma.documentChunk.deleteMany({ where: { documentId: id } });
  await prisma.document.delete({ where: { id } });
  revalidatePath(`/admin/knowledge/${kbId}`);
}
export async function addUrlDocument(formData: FormData) {
  const url = formData.get("url") as string;
  const kbId = formData.get("knowledgeBaseId") as string;
  const doc = await prisma.document.create({ data: { filename: url, type: "URL", knowledgeBaseId: kbId } });
  await processUrl(url, kbId, doc.id);
  revalidatePath(`/admin/knowledge/${kbId}`);
}
export async function updateSettings(formData: FormData) {
  const orgName = formData.get("organizationName") as string;
  const orgInfo = formData.get("organizationBuzonInfo") as string;
  const isBuzonActive = formData.get("isBuzonActive") === "true";
  const settings = await prisma.settings.findFirst();
  const data = { organizationName: orgName, organizationBuzonInfo: orgInfo, isBuzonActive };
  if (settings) await prisma.settings.update({ where: { id: settings.id }, data });
  else await prisma.settings.create({ data });
  revalidatePath("/admin/settings"); revalidatePath("/buzon");
}
export async function exportFullBackup() {
  const [groups, chatbots, kbs, docs] = await Promise.all([
    prisma.group.findMany(), prisma.chatbot.findMany(), prisma.knowledgeBase.findMany(), prisma.document.findMany()
  ]);
  return { groups, chatbots, kbs, docs };
}
export async function importFullBackup(data: any) {
  try {
    const { groups, kbs, chatbots } = data;
    if (groups) await prisma.group.createMany({ data: groups, skipDuplicates: true });
    revalidatePath("/admin"); return { success: true, error: "" };
  } catch (error: any) { return { success: false, error: error.message || "Error" }; }
}