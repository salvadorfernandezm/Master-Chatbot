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

// ==========================================
// 1. SEGURIDAD Y ESCALAMIENTO
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
// 2. MOTOR DEL BUZÓN Y PROPUESTAS
// ==========================================
export async function createTicket(formData: FormData): Promise<{ success: boolean; folio: string }> {
  const type = formData.get("type") as string || "DENUNCIA";
  const category = formData.get("category") as string || "GENERAL";
  const academicProgram = formData.get("academicProgram") as string || "Psicología";
  const modality = formData.get("modality") as string || "Presencial";
  const content = formData.get("content") as string || "";
  const studentName = formData.get("studentName") as string || "Anónimo Protegido";
  const studentEmail = formData.get("studentEmail") as string || "sin-correo@ujed.mx";
  if (!content) return { success: false, folio: "" };
  const folio = `ETH-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  try {
    const ticket = await prisma.ticket.create({
      data: { folio, type, category, content, studentName, studentEmail, academicProgram, modality, status: "PENDIENTE" },
    });
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

export async function setStudentSatisfaction(id: string, satisfied: boolean) {
  try {
    await prisma.ticket.update({ where: { id }, data: { studentResolved: satisfied } });
    revalidatePath("/seguimiento"); return { success: true };
  } catch (error) { return { success: false }; }
}

export async function submitAuthorityResponse(formData: FormData) {
  const id = formData.get("id") as string;
  const responseText = formData.get("responseText") as string;
  try {
    await prisma.ticket.update({ where: { id }, data: { authorityResponse: responseText, status: "RESUELTO", updatedAt: new Date() } });
    revalidatePath("/admin/buzon"); revalidatePath("/seguimiento"); revalidatePath("/admin/directora"); return { success: true };
  } catch (error) { return { success: false }; }
}

export async function updateTicketStatus(id: string, newStatus: string) {
  await prisma.ticket.update({ where: { id }, data: { status: newStatus } });
  revalidatePath("/admin/buzon"); revalidatePath("/admin/directora");
}

export async function downloadFullHistory() {
  try {
    const [tickets, proposals] = await Promise.all([
      prisma.ticket.findMany({ include: { attachments: true }, orderBy: { createdAt: 'desc' } }),
      prisma.proposal.findMany({ orderBy: { createdAt: 'desc' } })
    ]);
    let csv = "\ufeff--- REPORTE DE BUZÓN ---\nFolio,Fecha,Programa,Modalidad,Autor,Estatus\n";
    tickets.forEach(t => { csv += `${t.folio},${t.createdAt.toLocaleDateString()},${t.academicProgram},${t.modality},${t.studentName},${t.status}\n`; });
    return { success: true, data: csv };
  } catch (error) { return { success: false, data: "" }; }
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
  const kbId = formData.get("knowledgeBaseId") as string;
  const token = randomBytes(4).toString("hex");
  await prisma.chatbot.create({ data: { name, token, groupId, knowledgeBaseId: kbId, isActive: true } });
  revalidatePath("/admin/chatbots");
}

export async function updateChatbot(formData: FormData) {
  const id = formData.get("id") as string;
  const updateData: any = {};
  
  // Campos de texto
  const fields = ["name", "welcomeMessage", "systemInstructions", "inputPlaceholder", "fallbackMessage", "infoMessage", "logoUrl", "knowledgeBaseId", "groupId", "backgroundImageUrl"];
  fields.forEach(f => {
    const v = formData.get(f); if (v !== null) updateData[f] = v as string;
  });

  // Campos numéricos (Posiciones de fondo)
  updateData.bgPositionMobile = parseInt(formData.get("bgPositionMobile") as string) || 50;
  updateData.bgPositionDesktop = parseInt(formData.get("bgPositionDesktop") as string) || 50;

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
// 4. CONOCIMIENTO (KNOWLEDGE BASE)
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

// ==========================================
// 5. CONFIGURACIÓN Y BACKUP
// ==========================================
export async function updateSettings(formData: FormData) {
  const orgName = formData.get("organizationName") as string;
  const orgLogo = formData.get("organizationLogo") as string;
  const orgInfo = formData.get("organizationBuzonInfo") as string;
  const isBuzonActive = formData.get("isBuzonActive") === "true";
  const settings = await prisma.settings.findFirst();
  const data = { organizationName: orgName, organizationLogo: orgLogo, organizationBuzonInfo: orgInfo, isBuzonActive };
  if (settings) await prisma.settings.update({ where: { id: settings.id }, data });
  else await prisma.settings.create({ data: { id: 'default', ...data, organizationBuzonInfo: '' } });
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

export async function createProposal(formData: FormData) {
  try {
    const proposal = await prisma.proposal.create({
      data: {
        title: formData.get("title") as string,
        content: formData.get("content") as string,
        category: formData.get("category") as string,
        academicProgram: formData.get("academicProgram") as string || "Psicología",
        modality: formData.get("modality") as string || "Presencial",
        studentName: formData.get("studentName") as string || "Anónimo",
        studentEmail: formData.get("studentEmail") as string || "excelencia@ujed.mx",
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