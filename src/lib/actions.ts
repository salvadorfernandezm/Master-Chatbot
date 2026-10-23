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

// 1. SEGURIDAD
export async function verifyDirectorPin(pin: string) { return pin === process.env.DIRECTOR_PIN; }
export async function verifyPosgradoPin(pin: string) { return pin === process.env.POSGRADO_PIN; }

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

// 2. CHATBOTS
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
  const fields = ["name", "welcomeMessage", "systemInstructions", "inputPlaceholder", "fallbackMessage", "infoMessage", "logoUrl", "knowledgeBaseId", "groupId", "backgroundImageUrl", "groupOptions", "nameMode", "emailMode", "groupMode"];
  fields.forEach(f => {
    const v = formData.get(f); if (v !== null) updateData[f] = v as string;
  });
  const isActive = formData.get("isActive"); if (isActive !== null) updateData.isActive = isActive === "true";
  const showIntro = formData.get("showIntro"); if (showIntro !== null) updateData.showIntro = showIntro === "true";
  await prisma.chatbot.update({ where: { id }, data: updateData });
  revalidatePath("/admin/chatbots");
}

export async function deleteChatbot(id: string) {
  await prisma.chatbot.delete({ where: { id } });
  revalidatePath("/admin/chatbots");
}

// 3. BUZÓN Y PROPUESTAS
export async function createTicket(formData: FormData): Promise<{ success: boolean; folio: string }> {
  const content = formData.get("content") as string;
  const type = formData.get("type") as string || "DENUNCIA";
  const studentName = formData.get("studentName") as string;
  const studentEmail = formData.get("studentEmail") as string;
  if (!content || !studentName || !studentEmail) return { success: false, folio: "" };
  const folio = `ETH-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  try {
    const ticket = await prisma.ticket.create({
      data: { folio, type, content, studentName, studentEmail, status: "PENDIENTE" },
    });
    revalidatePath("/admin/buzon");
    return { success: true, folio: ticket.folio };
  } catch (error) { return { success: false, folio: "" }; }
}

export async function submitAppeal(id: string, reason: string) {
  const ticket = await prisma.ticket.findUnique({ where: { id } });
  const newHistory = `[RESPUESTA]: ${ticket?.authorityResponse}\n\n[APELACIÓN]: ${reason}`;
  await prisma.ticket.update({ where: { id }, data: { status: "APELADO", authorityResponse: newHistory } });
  revalidatePath("/seguimiento"); return { success: true };
}

export async function submitAuthorityResponse(formData: FormData) {
  const id = formData.get("id") as string;
  const responseText = formData.get("responseText") as string;
  await prisma.ticket.update({ where: { id }, data: { authorityResponse: responseText, status: "RESUELTO", updatedAt: new Date() } });
  revalidatePath("/admin/buzon"); return { success: true };
}

export async function updateTicketStatus(id: string, newStatus: string) {
  await prisma.ticket.update({ where: { id }, data: { status: newStatus } });
  revalidatePath("/admin/buzon");
}

export async function createProposal(formData: FormData) {
  const proposal = await prisma.proposal.create({
    data: {
      title: formData.get("title") as string,
      content: formData.get("content") as string,
      category: formData.get("category") as string,
      studentName: formData.get("studentName") as string,
      studentEmail: formData.get("studentEmail") as string,
      aiFeedback: formData.get("aiFeedback") as string,
      status: "EN_REVISION"
    }
  });
  revalidatePath("/excelencia"); return { success: true, id: proposal.id };
}

export async function voteProposal(id: string) {
  await prisma.proposal.update({ where: { id }, data: { votes: { increment: 1 } } });
  revalidatePath("/excelencia/mural"); return { success: true };
}

export async function updateProposalStatus(id: string, status: string) {
  await prisma.proposal.update({ where: { id }, data: { status } });
  revalidatePath("/admin/gestion-propuestas"); return { success: true };
}

// 4. KNOWLEDGE Y SETTINGS
export async function createKnowledgeBase(formData: FormData) {
  const name = formData.get("name") as string;
  await prisma.knowledgeBase.create({ data: { name, description: "" } });
  revalidatePath("/admin/knowledge");
}

export async function updateKnowledgeBase(formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  await prisma.knowledgeBase.update({ where: { id }, data: { name } });
  revalidatePath("/admin/knowledge");
}

export async function deleteKnowledgeBase(id: string) {
  await prisma.knowledgeBase.delete({ where: { id } });
  revalidatePath("/admin/knowledge");
}

export async function uploadFileDocument(formData: FormData) {
  const file = formData.get("file") as File;
  const kbId = formData.get("knowledgeBaseId") as string;
  const buffer = Buffer.from(await file.arrayBuffer());
  const doc = await prisma.document.create({ data: { filename: file.name, type: "PDF", knowledgeBaseId: kbId } });
  await processFile(buffer, file.name, "PDF", kbId, doc.id);
  revalidatePath(`/admin/knowledge/${kbId}`);
}

export async function downloadFullHistory() {
  const [tickets, proposals] = await Promise.all([prisma.ticket.findMany(), prisma.proposal.findMany()]);
  let csv = "\ufeffFolio,Fecha,Autor,Estatus\n";
  tickets.forEach(t => { csv += `${t.folio},${t.createdAt.toLocaleDateString()},${t.studentName},${t.status}\n`; });
  return { success: true, data: csv };
}

export async function downloadChatInteractions(chatbotId: string) {
  const data = await prisma.interaction.findMany({ where: { chatbotId }, orderBy: { createdAt: 'desc' } });
  let csv = "\ufeffFecha,Estudiante,Pregunta,Respuesta\n";
  data.forEach(i => { csv += `${i.createdAt.toLocaleDateString()},${i.studentName || "Anónimo"},"${i.query.replace(/"/g, '""')}","${i.response.replace(/"/g, '""')}"\n`; });
  return { success: true, data: csv };
}

export async function setStudentSatisfaction(id: string, satisfied: boolean) {
  await prisma.ticket.update({ where: { id }, data: { studentResolved: satisfied } });
  revalidatePath("/seguimiento"); return { success: true };
}