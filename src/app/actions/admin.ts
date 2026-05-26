"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { processFile, processUrl } from "@/lib/documentProcessor";
import { randomBytes } from "crypto";

// ==========================================
// 1. GESTIÓN DEL BUZÓN ÉTICO (Tickets)
// ==========================================

export async function createTicket(formData: FormData) {
  const type = formData.get("type") as string;
  const content = formData.get("content") as string;
  const studentName = formData.get("studentName") as string;
  const studentEmail = formData.get("studentEmail") as string;
  const file = formData.get("evidence") as File;

  if (!content || !type) return { success: false, error: "Faltan datos" };

  const folio = `ETH-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  try {
    await prisma.ticket.create({
      data: {
        folio,
        type,
        content,
        studentName: studentName || "Anónimo Protegido",
        studentEmail: studentEmail || null,
        evidenceUrl: file && file.size > 0 ? `Adjunto: ${file.name}` : null,
        status: "PENDIENTE",
      },
    });
    revalidatePath("/admin/buzon");
    return { success: true, folio };
  } catch (error) {
    console.error("Error al crear ticket:", error);
    return { success: false };
  }
}

// LA PIEZA QUE FALTABA:
export async function updateTicketStatus(id: string, newStatus: string) {
  try {
    await prisma.ticket.update({
      where: { id },
      data: { status: newStatus }
    });
    revalidatePath("/admin/buzon");
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar estatus:", error);
    return { success: false };
  }
}

// ==========================================
// 2. GESTIÓN DE CHATBOTS Y GRUPOS
// ==========================================

export async function createChatbot(formData: FormData) {
  const name = formData.get("name") as string;
  const groupId = formData.get("groupId") as string;
  const knowledgeBaseId = formData.get("knowledgeBaseId") as string;
  const token = randomBytes(4).toString("hex");

  await prisma.chatbot.create({
    data: {
      name,
      token,
      groupId,
      knowledgeBaseId,
      isActive: true,
    },
  });
  revalidatePath("/admin/chatbots");
}

export async function updateChatbot(formData: FormData) {
  const id = formData.get("id") as string;
  const updateData: any = {};
  const fields = ["name", "welcomeMessage", "systemInstructions", "inputPlaceholder", "fallbackMessage", "isActive"];
  
  fields.forEach(field => {
    const value = formData.get(field);
    if (value !== null) {
      if (field === "isActive") updateData[field] = value === "true";
      else updateData[field] = value as string;
    }
  });

  await prisma.chatbot.update({ where: { id }, data: updateData });
  revalidatePath("/admin/chatbots");
}

export async function deleteChatbot(id: string) {
  await prisma.chatbot.delete({ where: { id } });
  revalidatePath("/admin/chatbots");
}

// ==========================================
// 3. GESTIÓN DE CONOCIMIENTO Y DOCUMENTOS
// ==========================================

export async function createKnowledgeBase(formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  await prisma.knowledgeBase.create({ data: { name, description } });
  revalidatePath("/admin/knowledge");
}

export async function uploadFileDocument(formData: FormData) {
  const file = formData.get("file") as File;
  const knowledgeBaseId = formData.get("knowledgeBaseId") as string;
  if (!file || !knowledgeBaseId) return;

  let type = "WORD";
  if (file.name.toLowerCase().endsWith(".pdf")) type = "PDF";
  else if (file.name.toLowerCase().endsWith(".xlsx")) type = "EXCEL";

  const buffer = Buffer.from(await file.arrayBuffer());
  const doc = await prisma.document.create({
    data: { filename: file.name, type, knowledgeBaseId },
  });

  await processFile(buffer, file.name, type, knowledgeBaseId, doc.id);
  revalidatePath(`/admin/knowledge/${knowledgeBaseId}`);
}

// ==========================================
// 4. CONFIGURACIÓN Y RESPALDO
// ==========================================

export async function updateSettings(formData: FormData) {
  const organizationName = formData.get("organizationName") as string;
  const settings = await prisma.settings.findFirst();
  if (settings) {
    await prisma.settings.update({ where: { id: settings.id }, data: { organizationName } });
  } else {
    await prisma.settings.create({ data: { organizationName } });
  }
  revalidatePath("/admin/settings");
}

export async function exportFullBackup() {
  const [groups, chatbots, kbs, docs] = await Promise.all([
    prisma.group.findMany(),
    prisma.chatbot.findMany(),
    prisma.knowledgeBase.findMany(),
    prisma.document.findMany(),
  ]);
  return { date: new Date().toISOString(), data: { groups, chatbots, kbs, docs } };
}