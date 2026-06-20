"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// 1. INICIALIZACIÓN DE CLIENTES
const resend = new Resend(process.env.RESEND_API_KEY);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// ==========================================
// 1. SEGURIDAD Y ACCESO
// ==========================================
export async function verifyDirectorPin(pin: string) {
  return pin === process.env.DIRECTOR_PIN;
}

// ==========================================
// 2. MOTOR DEL BUZÓN (TICKETS Y APELACIONES)
// ==========================================

export async function createTicket(formData: FormData): Promise<{ success: boolean; folio: string }> {
  const type = formData.get("type") as string;
  const category = formData.get("category") as string;
  const content = formData.get("content") as string;
  const studentName = formData.get("studentName") as string;
  const studentEmail = formData.get("studentEmail") as string;
  const files = formData.getAll("evidence"); 

  if (!content || !type) return { success: false, folio: "" };
  const folio = `ETH-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  try {
    const ticket = await prisma.ticket.create({
      data: {
        folio, type, category, content,
        studentName: studentName || "Anónimo Protegido",
        studentEmail: studentEmail || null,
        status: "PENDIENTE",
      },
    });

    if (supabase && files.length > 0) {
      for (const file of files) {
        const f = file as any;
        if (f.size > 0) {
          const cleanName = f.name.replace(/[^a-zA-Z0-9.]/g, "_");
          const fileName = `student/${ticket.id}-${Date.now()}-${cleanName}`;
          const arrayBuffer = await f.arrayBuffer();
          const { error: uploadError } = await supabase.storage.from('evidencias').upload(fileName, Buffer.from(arrayBuffer), { contentType: f.type, upsert: true });
          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage.from('evidencias').getPublicUrl(fileName);
            await prisma.attachment.create({ data: { url: publicUrl, name: f.name, type: "STUDENT", ticketId: ticket.id } });
          }
        }
      }
    }

    // AVISO A AUTORIDAD
    let emailDestino = process.env.EMAIL_INGENIERO;
    const criterio = type === "SOPORTE_TECNICO" ? "SOPORTE_TECNICO" : category;
    if (criterio === "ACADEMICO") emailDestino = process.env.EMAIL_SECRETARIA_ACADEMICA;
    else if (criterio === "LOGISTICA") emailDestino = process.env.EMAIL_SECRETARIA_ADMINISTRATIVA;
    else if (criterio === "GRAVE") emailDestino = process.env.EMAIL_DIRECCION;

    if (process.env.RESEND_API_KEY && emailDestino) {
      await resend.emails.send({
        from: 'Buzon Etico <onboarding@resend.dev>',
        to: [emailDestino as string],
        subject: `Nuevo Reporte [${criterio}]: ${folio}`,
        html: `<p><strong>Folio:</strong> ${folio}</p><p><strong>Mensaje:</strong> ${content}</p><br/><a href="https://master-chatbot-rho.vercel.app/admin/responder?folio=${folio}">Responder aquí</a>`
      }).catch(e => console.error(e));
    }

    revalidatePath("/admin/buzon");
    return { success: true, folio: ticket.folio };
  } catch (error) { return { success: false, folio: "" }; }
}

export async function submitAppeal(id: string, reason: string) {
  try {
    await prisma.ticket.update({
      where: { id },
      data: { status: "APELADO", authorityResponse: `⚠️ APELACIÓN: ${reason}` },
    });
    revalidatePath("/seguimiento");
    revalidatePath("/admin/buzon");
    return { success: true };
  } catch (error) { return { success: false }; }
}

export async function setStudentSatisfaction(id: string, satisfied: boolean) {
  try {
    await prisma.ticket.update({ where: { id }, data: { studentResolved: satisfied } });
    revalidatePath("/seguimiento");
    return { success: true };
  } catch (error) { return { success: false }; }
}

// --- FUNCIÓN DE RESPUESTA COMPLETADA ---
export async function submitAuthorityResponse(formData: FormData) {
  const id = formData.get("id") as string;
  const responseText = formData.get("responseText") as string;
  const files = formData.getAll("evidence");

  try {
    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: { authorityResponse: responseText, status: "RESUELTO", updatedAt: new Date() },
    });

    // SUBIR EVIDENCIAS DE LA AUTORIDAD
    if (supabase && files.length > 0) {
      for (const file of files) {
        const f = file as any;
        if (f.size > 0) {
          const fileName = `authority/${id}-${Date.now()}-${f.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
          const arrayBuffer = await f.arrayBuffer();
          const { error } = await supabase.storage.from('evidencias').upload(fileName, Buffer.from(arrayBuffer), { contentType: f.type, upsert: true });
          if (!error) {
            const { data: { publicUrl } } = supabase.storage.from('evidencias').getPublicUrl(fileName);
            await prisma.attachment.create({
              data: { url: publicUrl, name: f.name, type: "AUTHORITY", ticketId: id }
            });
          }
        }
      }
    }

    // NOTIFICAR AL ALUMNO SI DEJÓ EMAIL
    if (updatedTicket.studentEmail && process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: 'Buzon Etico <onboarding@resend.dev>',
        to: [updatedTicket.studentEmail],
        subject: `Respuesta a tu reporte: ${updatedTicket.folio}`,
        html: `<p>La autoridad ha respondido a tu reporte <strong>${updatedTicket.folio}</strong>.</p>
               <p>Puedes ver la resolución completa aquí: <a href="https://master-chatbot-rho.vercel.app/seguimiento">Ver seguimiento</a></p>`
      }).catch(e => console.error(e));
    }

    revalidatePath("/admin/buzon");
    revalidatePath("/seguimiento");
    return { success: true };
  } catch (error) { return { success: false }; }
}

export async function updateTicketStatus(id: string, newStatus: string) {
  await prisma.ticket.update({ where: { id }, data: { status: newStatus } });
  revalidatePath("/admin/buzon");
}

// ==========================================
// 3. GESTIÓN DE CHATBOTS Y GRUPOS
// ==========================================

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
  const knowledgeBaseId = formData.get("knowledgeBaseId") as string;
  const token = randomBytes(4).toString("hex");
  await prisma.chatbot.create({ data: { name, token, groupId, knowledgeBaseId } });
  revalidatePath("/admin/chatbots");
}

export async function updateChatbot(formData: FormData) {
  const id = formData.get("id") as string;
  const updateData: any = {};
  ["name", "welcomeMessage", "systemInstructions", "inputPlaceholder", "fallbackMessage", "infoMessage", "logoUrl"].forEach(f => {
    const v = formData.get(f);
    if (v !== null) updateData[f] = v as string;
  });
  const active = formData.get("isActive");
  if (active !== null) updateData.isActive = active === "true";
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

// ==========================================
// 4. CONFIGURACIÓN Y BACKUP
// ==========================================

export async function updateSettings(formData: FormData) {
  const organizationName = formData.get("organizationName") as string;
  const organizationBuzonInfo = formData.get("organizationBuzonInfo") as string;
  const settings = await prisma.settings.findFirst();
  if (settings) await prisma.settings.update({ where: { id: settings.id }, data: { organizationName, organizationBuzonInfo } });
  else await prisma.settings.create({ data: { organizationName, organizationBuzonInfo } });
  revalidatePath("/admin/settings");
}

export async function exportFullBackup() {
  const [groups, chatbots, kbs, docs] = await Promise.all([
    prisma.group.findMany(), prisma.chatbot.findMany(), prisma.knowledgeBase.findMany(), prisma.document.findMany(),
  ]);
  return { groups, chatbots, kbs, docs };
}

export async function importFullBackup(data: any) {
  try {
    const { groups, kbs, chatbots } = data;
    if (groups) await prisma.group.createMany({ data: groups, skipDuplicates: true });
    revalidatePath("/admin");
    return { success: true, error: "" };
  } catch (error: any) { return { success: false, error: error.message }; }
}