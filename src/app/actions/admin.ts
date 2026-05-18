"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { processFile, processUrl } from "@/lib/documentProcessor";
import { randomBytes } from "crypto";

// ==========================================
// 1. CONFIGURACIÓN GLOBAL
// ==========================================
export async function updateSettings(formData: FormData) {
  // Obtenemos los valores; si vienen vacíos, no importa, le asignamos un string vacío
  const organizationName = (formData.get("organizationName") as string) || "Mi Escuela";
  const organizationLogo = (formData.get("organizationLogo") as string) || "";
  const defaultWelcomeMessage = (formData.get("defaultWelcomeMessage") as string) || "Hola!";
  const organizationBuzonInfo = (formData.get("organizationBuzonInfo") as string) || "Aún no hay reglas.";
  
  const settings = await prisma.settings.findFirst();

  const data = {
    organizationName,
    organizationLogo,
    defaultWelcomeMessage,
    organizationBuzonInfo,
    timezone: "America/Mexico_City"
  };

  try {
    if (settings) {
      await prisma.settings.update({ where: { id: settings.id }, data });
    } else {
      await prisma.settings.create({ data });
    }
    revalidatePath("/admin/settings");
  } catch (error) {
    console.error("Error salvando ajustes:", error);
  }
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
  // AÑADIMOS 'infoMessage' a la lista de abajo:
  const fields = ["name", "welcomeMessage", "infoMessage", "systemInstructions", "inputPlaceholder", "fallbackMessage"];
  
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

// --- FUNCIÓN DE EXPORTACIÓN (Para descargar) ---
export async function exportFullBackup() {
  const [groups, chatbots, kbs, docs] = await Promise.all([
    prisma.group.findMany(),
    prisma.chatbot.findMany(),
    prisma.knowledgeBase.findMany(),
    prisma.document.findMany(),
  ]);

  return {
    version: "2.0",
    date: new Date().toISOString(),
    data: { groups, chatbots, kbs, docs }
  };
}

// --- FUNCIÓN DE IMPORTACIÓN (Corregida para TypeScript) ---
export async function importFullBackup(jsonData: string) {
  try {
    const backup = JSON.parse(jsonData);
    const { groups, chatbots, kbs, docs } = backup.data;

    await prisma.$transaction([
      prisma.interaction.deleteMany(),
      prisma.documentChunk.deleteMany(),
      prisma.document.deleteMany(),
      prisma.chatbot.deleteMany(),
      prisma.knowledgeBase.deleteMany(),
      prisma.group.deleteMany(),
    ]);

    if (groups.length) await prisma.group.createMany({ data: groups });
    if (kbs.length) await prisma.knowledgeBase.createMany({ data: kbs });
    if (chatbots.length) await prisma.chatbot.createMany({ data: chatbots });
    if (docs.length) await prisma.document.createMany({ data: docs });

    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) { // <--- EL TRUCO ESTÁ EN ESTE ": any"
    console.error("Error en restauración:", error);
    return { success: false, error: error.message || "Error desconocido" };
  }
}

// --- ACCIÓN PARA EL BUZÓN INTELIGENTE ---
export async function createTicket(formData: FormData) {
  const type = formData.get("type") as string;
  const content = formData.get("content") as string;
  const studentName = formData.get("studentName") as string;

  if (!content || !type) return;

  try {
    await prisma.ticket.create({
      data: {
        type,
        content,
        studentName: studentName || "Anónimo",
        status: "PENDIENTE",
      },
    });

    // Recargamos la ruta del administrador para que veas el nuevo ticket
    revalidatePath("/admin");
    
    // Aquí podrías redirigir a una página de "Gracias", 
    // pero por ahora dejémoslo que recargue el buzón.
  } catch (error) {
    console.error("Error al enviar ticket:", error);
  }
}