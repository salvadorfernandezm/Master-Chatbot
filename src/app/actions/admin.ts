"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { processFile, processUrl } from "@/lib/documentProcessor";
import { randomBytes } from "crypto";

// ==========================================
// 1. CONFIGURACIÓN GLOBAL
// ==========================================
export async function updateSettings(formData: FormData) {
  const orgName = formData.get("orgName") as string;
  const logoUrl = formData.get("logoUrl") as string;
  const settings = await prisma.settings.findFirst();

  if (settings) {
    await prisma.settings.update({
      where: { id: settings.id },
      data: { 
        organizationName: orgName,
        organizationLogo: logoUrl 
      }
    });
  } else {
    await prisma.settings.create({
      data: { 
        organizationName: orgName, 
        organizationLogo: logoUrl 
      }
    });
  }
  revalidatePath("/admin/settings");
}

// ==========================================
// 2. ACCIONES DE GRUPOS
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
// 3. ACCIONES DE CHATBOTS
// ==========================================
export async function createChatbot(formData: FormData) {
  const name = formData.get("name") as string;
  const groupId = formData.get("groupId") as string;
  const knowledgeBaseId = formData.get("knowledgeBaseId") as string;
  const welcomeMessage = formData.get("welcomeMessage") as string;
  const inputPlaceholder = formData.get("inputPlaceholder") as string;
  const token = randomBytes(4).toString("hex");

  await prisma.chatbot.create({
    data: {
      name,
      token,
      groupId,
      knowledgeBaseId,
      welcomeMessage: welcomeMessage || "¡Hola! ¿En qué puedo ayudarte?",
      inputPlaceholder: inputPlaceholder || "Escribe tu duda aquí...",
      isActive: true,
    },
  });
  revalidatePath("/admin/chatbots");
}

export async function updateChatbot(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;

  const updateData: any = {};
  const fields = ["name", "welcomeMessage", "systemInstructions", "inputPlaceholder", "fallbackMessage"];
  fields.forEach(field => {
    const value = formData.get(field);
    if (value !== null) updateData[field] = value as string;
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
// 4. ACCIONES DE BASES DE CONOCIMIENTO
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
  const docs = await prisma.document.findMany({ where: { knowledgeBaseId: id } });
  for (const doc of docs) {
    await prisma.documentChunk.deleteMany({ where: { documentId: doc.id } });
  }
  await prisma.document.deleteMany({ where: { knowledgeBaseId: id } });
  await prisma.knowledgeBase.delete({ where: { id } });
  revalidatePath("/admin/knowledge");
}

// ==========================================
// 5. ACCIONES DE DOCUMENTOS (Simplificadas sin 'status')
// ==========================================
export async function uploadFileDocument(formData: FormData) {
  const file = formData.get("file") as File;
  const knowledgeBaseId = formData.get("knowledgeBaseId") as string;
  if (!file || !knowledgeBaseId) return;

  let type = "WORD";
  const fileName = file.name.toLowerCase();
  if (fileName.endsWith(".pdf")) type = "PDF";
  else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) type = "EXCEL";
  else if (fileName.endsWith(".txt")) type = "TEXT";

  const buffer = Buffer.from(await file.arrayBuffer());
  
  // Creamos el registro del documento
  const doc = await prisma.document.create({
    data: { 
      filename: file.name, 
      type, 
      knowledgeBaseId 
    },
  });

  try {
    // Procesamos el archivo (esto crea los fragmentos en la DB)
    await processFile(buffer, file.name, type, knowledgeBaseId, doc.id);
  } catch (error) {
    console.error("Error procesando archivo:", error);
  }
  revalidatePath(`/admin/knowledge/${knowledgeBaseId}`);
}

export async function addUrlDocument(formData: FormData) {
  const url = formData.get("url") as string;
  const knowledgeBaseId = formData.get("knowledgeBaseId") as string;
  if (!url || !knowledgeBaseId) return;

  const doc = await prisma.document.create({
    data: { 
      filename: url, 
      type: "URL", 
      knowledgeBaseId 
    },
  });

  try {
    await processUrl(url, knowledgeBaseId, doc.id);
  } catch (error) {
    console.error("Error procesando URL:", error);
  }
  revalidatePath(`/admin/knowledge/${knowledgeBaseId}`);
}

export async function deleteDocument(id: string, knowledgeBaseId: string) {
  await prisma.documentChunk.deleteMany({ where: { documentId: id } });
  await prisma.document.delete({ where: { id } });
  revalidatePath(`/admin/knowledge/${knowledgeBaseId}`);
}