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

export const maxDuration = 60;

// ==========================================
// 1. SEGURIDAD Y ACCESO
// ==========================================
export async function verifyDirectorPin(pin: string) {
  return pin === process.env.DIRECTOR_PIN;
}

export async function verifyPosgradoPin(pin: string) {
  return pin === process.env.POSGRADO_PIN;
}

export async function runEscalationLogic() {
  const limiteHoras = 72;
  const ahora = new Date();
  const fechaLimite = new Date(ahora.getTime() - (limiteHoras * 60 * 60 * 1000));
  const expirados = await prisma.ticket.findMany({
    where: { status: "PENDIENTE", createdAt: { lt: fechaLimite }, NOT: { type: "SOPORTE_TECNICO" } }
  });
  for (const ticket of expirados) {
    await prisma.ticket.update({ where: { id: ticket.id }, data: { status: "NO ATENDIDO EN TIEMPO" } });
  }
}

// ==========================================
// 2. GESTIÓN DE CHATBOTS (EL MOTOR COMPLETO)
// ==========================================

export async function createChatbot(formData: FormData) {
  const name = formData.get("name") as string;
  const groupId = formData.get("groupId") as string;
  const kbId = formData.get("knowledgeBaseId") as string;
  const token = randomBytes(4).toString("hex");
  await prisma.chatbot.create({
    data: { name, token, groupId, knowledgeBaseId: kbId, isActive: true }
  });
  revalidatePath("/admin/chatbots");
}

export async function updateChatbot(formData: FormData) {
  const id = formData.get("id") as string;
  const updateData: any = {};
  
  // Lista Maestra de Campos (18 campos)
  const fields = [
    "name", "welcomeMessage", "systemInstructions", "inputPlaceholder", 
    "fallbackMessage", "infoMessage", "logoUrl", "backgroundImageUrl", 
    "groupOptions", "nameMode", "emailMode", "groupMode", "knowledgeBaseId", "groupId"
  ];

  fields.forEach(f => {
    const v = formData.get(f);
    if (v !== null) updateData[f] = v as string;
  });

  // Campos Numéricos
  updateData.bgPositionMobile = parseInt(formData.get("bgPositionMobile") as string) || 50;
  updateData.bgPositionDesktop = parseInt(formData.get("bgPositionDesktop") as string) || 50;
  updateData.bgPosXMobile = parseInt(formData.get("bgPosXMobile") as string) || 50;
  updateData.bgPosXDesktop = parseInt(formData.get("bgPosXDesktop") as string) || 50;
  updateData.introPos = parseInt(formData.get("introPos") as string) || 50;

  // Booleano: Mostrar Portada
  const showIntro = formData.get("showIntro");
  if (showIntro !== null) updateData.showIntro = showIntro === "true";

  // Booleano: Activo/Apagado
  const isActive = formData.get("isActive");
  if (isActive !== null) updateData.isActive = isActive === "true";

  await prisma.chatbot.update({ where: { id }, data: updateData });
  revalidatePath("/admin/chatbots");
}

export async function deleteChatbot(id: string) {
  await prisma.chatbot.delete({ where: { id } });
  revalidatePath("/admin/chatbots");
}

// ==========================================
// 3. MOTOR DEL BUZÓN (TICKETS Y CORREOS)
// ==========================================

export async function createTicket(formData: FormData): Promise<{ success: boolean; folio: string }> {
  const type = formData.get("type") as string || "DENUNCIA";
  const category = formData.get("category") as string || "GENERAL";
  const academicProgram = formData.get("academicProgram") as string || "Psicología";
  const modality = formData.get("modality") as string || "Presencial";
  const content = formData.get("content") as string;
  const studentName = formData.get("studentName") as string;
  const studentEmail = formData.get("studentEmail") as string;
  
  if (!content || !studentName || !studentEmail) return { success: false, folio: "" };
  
  const folio = `ETH-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const attachmentLinks: string[] = [];

  try {
    const ticket = await prisma.ticket.create({
      data: { folio, type, category, content, studentName, studentEmail, academicProgram, modality, status: "PENDIENTE" },
    });

    if (supabase && formData.getAll("evidence").length > 0) {
      const files = formData.getAll("evidence");
      for (const file of files) {
        const f = file as any;
        if (f.size > 0) {
          const fileName = `student/${ticket.id}-${Date.now()}-${f.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
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

    let emailDestino = process.env.EMAIL_INGENIERO;
    const criterio = type === "SOPORTE_TECNICO" ? "SOPORTE_TECNICO" : category;
    if (criterio === "ACADEMICO") emailDestino = process.env.EMAIL_SECRETARIA_ACADEMICA;
    else if (criterio === "LOGISTICA") emailDestino = process.env.EMAIL_SECRETARIA_ADMINISTRATIVA;
    else if (criterio === "GRAVE") emailDestino = process.env.EMAIL_DIRECCION;

    if (process.env.RESEND_API_KEY && emailDestino) {
      const responderUrl = `https://master-chatbot-rho.vercel.app/admin/responder?folio=${folio}`;
      const listaEvidencias = attachmentLinks.length > 0 ? `<ul>${attachmentLinks.map(l => `<li><a href="${l}">Ver</a></li>`).join('')}</ul>` : '';
      await resend.emails.send({
        from: 'Buzon Etico <onboarding@resend.dev>',
        to: [emailDestino as string],
        subject: `Nuevo Reporte: ${folio}`,
        html: `<p>Folio: ${folio}</p><p>${content}</p>${listaEvidencias}<br/><a href="${responderUrl}">Responder</a>`
      }).catch(e => console.error(e));
    }
    
    if (process.env.RESEND_API_KEY && studentEmail) {
      await resend.emails.send({
        from: 'Buzon Etico <onboarding@resend.dev>',
        to: [studentEmail as string],
        subject: `Confirmación de Reporte: ${folio}`,
        html: `<h2>Tu voz ha sido registrada</h2><p>Folio: <strong>${folio}</strong></p>`
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
    await prisma.ticket.update({ where: { id }, data: { status: "APELADO", authorityResponse: newHistory } });
    revalidatePath("/seguimiento"); revalidatePath("/admin/buzon"); return { success: true };
  } catch (error) { return { success: false }; }
}

export async function submitAuthorityResponse(formData: FormData) {
  const id = formData.get("id") as string;
  const responseText = formData.get("responseText") as string;
  try {
    await prisma.ticket.update({ where: { id }, data: { authorityResponse: responseText, status: "RESUELTO", updatedAt: new Date() } });
    revalidatePath("/admin/buzon"); revalidatePath("/seguimiento"); return { success: true };
  } catch (error) { return { success: false }; }
}

export async function updateTicketStatus(id: string, newStatus: string) {
  await prisma.ticket.update({ where: { id }, data: { status: newStatus } });
  revalidatePath("/admin/buzon");
  revalidatePath("/admin/directora");
}

// ==========================================
// 4. INICIATIVA DE EXCELENCIA
// ==========================================

export async function createProposal(formData: FormData) {
  try {
    const proposal = await prisma.proposal.create({
      data: {
        title: formData.get("title") as string,
        content: formData.get("content") as string,
        category: formData.get("category") as string,
        academicProgram: formData.get("academicProgram") as string || "Psicología",
        modality: formData.get("modality") as string || "Presencial",
        studentName: formData.get("studentName") as string,
        studentEmail: formData.get("studentEmail") as string,
        aiFeedback: formData.get("aiFeedback") as string,
        status: "EN_REVISION"
      }
    });
    revalidatePath("/excelencia"); return { success: true, id: proposal.id };
  } catch (error) { return { success: false }; }
}

export async function voteProposal(id: string) {
  try {
    await prisma.proposal.update({ where: { id }, data: { votes: { increment: 1 } } });
    revalidatePath("/excelencia/mural"); return { success: true };
  } catch (error) { return { success: false }; }
}

export async function updateProposalStatus(id: string, status: string) {
  try {
    await prisma.proposal.update({ where: { id }, data: { status } });
    revalidatePath("/admin/gestion-propuestas"); revalidatePath("/excelencia/mural"); return { success: true };
  } catch (error) { return { success: false }; }
}

// ==========================================
// 5. CONOCIMIENTO, AJUSTES Y BACKUP
// ==========================================

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
  const data = {
    organizationName: formData.get("organizationName") as string,
    organizationLogo: formData.get("organizationLogo") as string,
    organizationBuzonInfo: formData.get("organizationBuzonInfo") as string,
    isBuzonActive: formData.get("isBuzonActive") === "true",
    nameAcademica: formData.get("nameAcademica") as string,
    nameAdministrativa: formData.get("nameAdministrativa") as string,
    nameDireccion: formData.get("nameDireccion") as string,
    nameTecnico: formData.get("nameTecnico") as string,
  };
  const settings = await prisma.settings.findFirst();
  if (settings) await prisma.settings.update({ where: { id: settings.id }, data });
  else await prisma.settings.create({ data: { id: 'default', ...data } });
  revalidatePath("/admin/settings"); revalidatePath("/buzon");
}

export async function exportFullBackup() {
  const [groups, chatbots, kbs, docs, settings, proposals] = await Promise.all([
    prisma.group.findMany(), prisma.chatbot.findMany(), prisma.knowledgeBase.findMany(), prisma.document.findMany(), prisma.settings.findFirst(), prisma.proposal.findMany()
  ]);
  return { groups, chatbots, kbs, docs, settings, proposals };
}

export async function importFullBackup(data: any) {
  try {
    const { groups, kbs, chatbots, proposals } = data;
    if (groups) await prisma.group.createMany({ data: groups, skipDuplicates: true });
    if (proposals) await prisma.proposal.createMany({ data: proposals, skipDuplicates: true });
    revalidatePath("/admin"); return { success: true, error: "" };
  } catch (error: any) { return { success: false, error: error.message || "Error" }; }
}

export async function downloadFullHistory() {
  try {
    const [tickets, proposals] = await Promise.all([
      prisma.ticket.findMany({ include: { attachments: true }, orderBy: { createdAt: 'desc' } }),
      prisma.proposal.findMany({ orderBy: { createdAt: 'desc' } })
    ]);
    let csv = "\ufeff--- REPORTE DE BUZÓN ---\nFolio,Fecha,Programa,Modalidad,Autor,Estatus\n";
    tickets.forEach(t => { csv += `${t.folio},${t.createdAt.toLocaleDateString()},${t.academicProgram},${t.modality},${t.studentName},${t.status}\n`; });
    csv += "\n--- REPORTE DE EXCELENCIA ---\nFecha,Titulo,Autor,Programa,Votos\n";
    proposals.forEach(p => { csv += `${p.createdAt.toLocaleDateString()},"${p.title}",${p.studentName},${p.academicProgram},${p.votes}\n`; });
    return { success: true, data: csv };
  } catch (error) { return { success: false, data: "" }; }
}

export async function downloadChatInteractions(chatbotId: string) {
  try {
    const data = await prisma.interaction.findMany({ where: { chatbotId }, orderBy: { createdAt: 'desc' } });
    const headers = ["Fecha", "Grupo", "Estudiante", "Pregunta", "Respuesta"];
    const rows = data.map(i => [i.createdAt.toLocaleDateString(), i.studentGroup || "N/A", i.studentName || "Anónimo", `"${i.query.replace(/"/g, '""')}"`, `"${i.response.replace(/"/g, '""')}"`]);
    const csv = "\ufeff" + [headers, ...rows].map(e => e.join(",")).join("\n");
    return { success: true, data: csv };
  } catch (error) { return { success: false, data: "" }; }
}