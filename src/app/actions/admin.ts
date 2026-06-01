"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { processFile, processUrl } from "@/lib/documentProcessor";
import { randomBytes } from "crypto";

// ==========================================
// 1. AJUSTES GLOBALES (Logo, Reglamento, On/Off)
// ==========================================
export async function updateSettings(formData: FormData) {
  const organizationName = formData.get("organizationName") as string;
  const organizationLogo = formData.get("organizationLogo") as string;
  const organizationBuzonInfo = formData.get("organizationBuzonInfo") as string;
  const isBuzonActive = formData.get("isBuzonActive") === "true";

  const settings = await prisma.settings.findFirst();
  const data = { organizationName, organizationLogo, organizationBuzonInfo, isBuzonActive };

  if (settings) {
    await prisma.settings.update({ where: { id: settings.id }, data });
  } else {
    await prisma.settings.create({ data });
  }
  
  revalidatePath("/admin/settings");
  revalidatePath("/buzon");
}

// ==========================================
// 2. GESTIÓN DEL BUZÓN (Tickets de Alumnos)
// ==========================================
export async function createTicket(formData: FormData) {
  const type = formData.get("type") as string;
  const content = formData.get("content") as string;
  const studentName = formData.get("studentName") as string;
  const studentEmail = formData.get("studentEmail") as string;
  const file = formData.get("evidence") as File;

  if (!content || !type) return { success: false, error: "Faltan datos" };
  const folio = `ETH-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  try {
    await prisma.ticket.create({
      data: {
        folio,
        type,
        content,
        studentName: studentName || "Anónimo Protegido",
        studentEmail: studentEmail || null,
        evidenceUrl: file && file.size > 0 ? `Archivo: ${file.name}` : null,
        status: "PENDIENTE",
      },
    });
    revalidatePath("/admin/buzon");
    revalidatePath("/admin/directora");
    return { success: true, folio };
  } catch (error) {
    return { success: false };
  }
}

export async function updateTicketStatus(id: string, newStatus: string) {
  try {
    await prisma.ticket.update({ where: { id }, data: { status: newStatus } });
    revalidatePath("/admin/buzon");
    revalidatePath("/admin/directora");
    return { success: true };
  } catch (error) { return { success: false }; }
}

// ==========================================
// 3. GESTIÓN DE GRUPOS (Lo que Vercel reclamaba)
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

// ==========================================
// 4. GESTIÓN DE CHATBOTS (Identidad y Prompt)
// ==========================================
export async function createChatbot(formData: FormData) {
  const name = formData.get("name") as string;
  const groupId = formData.get("groupId") as string;
  const knowledgeBaseId = formData.get("knowledgeBaseId") as string;
  const manualToken = formData.get("manualToken") as string;
  const token = manualToken?.trim() || randomBytes(4).toString("hex");

  await prisma.chatbot.create({
    data: { name, token, groupId, knowledgeBaseId, isActive: true },
  });
  revalidatePath("/admin/chatbots");
}

export async function updateChatbot(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;
  const updateData: any = {};
  const fields = ["name", "welcomeMessage", "systemInstructions", "inputPlaceholder", "fallbackMessage", "infoMessage"];
  
  fields.forEach(field => {
    if (formData.has(field)) updateData[field] = formData.get(field) as string;
  });

  const isActiveStr = formData.get("isActive");
  if (isActiveStr !== null) updateData.isActive = isActiveStr === "true";

  await prisma.chatbot.update({ where: { id }, data: updateData });
  revalidatePath("/admin/chatbots");
}

export async function deleteChatbot(id: string) {
  await prisma.chatbot.delete({ where: { id } });
  revalidatePath("/admin/chatbots");
}

// ==========================================
// 5. CONOCIMIENTO (Bases y Documentos)
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
  await prisma.documentChunk.deleteMany({ where: { knowledgeBaseId: id } });
  await prisma.document.deleteMany({ where: { knowledgeBaseId: id } });
  await prisma.knowledgeBase.delete({ where: { id } });
  revalidatePath("/admin/knowledge");
}

export async function uploadFileDocument(formData: FormData) {
  const file = formData.get("file") as File;
  const knowledgeBaseId = formData.get("knowledgeBaseId") as string;
  if (!file || !knowledgeBaseId) return;
  const buffer = Buffer.from(await file.arrayBuffer());
  const type = file.name.toLowerCase().endsWith('.pdf') ? 'PDF' : (file.name.toLowerCase().endsWith('.xlsx') ? 'EXCEL' : 'WORD');
  const doc = await prisma.document.create({ data: { filename: file.name, type, knowledgeBaseId } });
  await processFile(buffer, file.name, type, knowledgeBaseId, doc.id);
  revalidatePath(`/admin/knowledge/${knowledgeBaseId}`);
}

export async function deleteDocument(id: string, knowledgeBaseId: string) {
  await prisma.documentChunk.deleteMany({ where: { documentId: id } });
  await prisma.document.delete({ where: { id } });
  revalidatePath(`/admin/knowledge/${knowledgeBaseId}`);
}

export async function addUrlDocument(formData: FormData) {
  const url = formData.get("url") as string;
  const knowledgeBaseId = formData.get("knowledgeBaseId") as string;
  const doc = await prisma.document.create({ data: { filename: url, type: "URL", knowledgeBaseId } });
  await processUrl(url, knowledgeBaseId, doc.id);
  revalidatePath(`/admin/knowledge/${knowledgeBaseId}`);
}

// ==========================================
// 6. RESPALDO (Import/Export)
// ==========================================
export async function exportFullBackup() {
  const [groups, chatbots, kbs, docs] = await Promise.all([
    prisma.group.findMany(),
    prisma.chatbot.findMany(),
    prisma.knowledgeBase.findMany(),
    prisma.document.findMany(),
  ]);
  return { groups, chatbots, kbs, docs };
}

export async function importFullBackup(data: any): Promise<{ success: boolean; error?: string }> {
  try {
    const { groups, kbs, chatbots } = data;
    if (groups) await prisma.group.createMany({ data: groups, skipDuplicates: true });
    if (kbs) await prisma.knowledgeBase.createMany({ data: kbs, skipDuplicates: true });
    if (chatbots) await prisma.chatbot.createMany({ data: chatbots, skipDuplicates: true });
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}