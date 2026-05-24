"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { processFile, processUrl } from "@/lib/documentProcessor";
import { randomBytes } from "crypto";

// ==========================================
// 1. CONFIGURACIÓN GLOBAL
// ==========================================
export async function updateSettings(formData: FormData) {
  const organizationName = (formData.get("organizationName") as string) || "Mi Escuela";
  const organizationLogo = (formData.get("organizationLogo") as string) || "";
  const defaultWelcomeMessage = (formData.get("defaultWelcomeMessage") as string) || "¡Hola!";
  
  // LA CLAVE: No usamos .trim() al final para no quitar espacios que tú pusiste a propósito
  const organizationBuzonInfo = (formData.get("organizationBuzonInfo") as string) || "";
  
  const isBuzonActive = formData.get("isBuzonActive") === "true";

  const settings = await prisma.settings.findFirst();

  const data = {
    organizationName,
    organizationLogo,
    defaultWelcomeMessage,
    organizationBuzonInfo, // <-- Guardado puro
    isBuzonActive,
    timezone: "America/Mexico_City"
  };

  try {
    if (settings) {
      await prisma.settings.update({ where: { id: settings.id }, data });
    } else {
      await prisma.settings.create({ data: { ...data, id: "default-settings" } });
    }
    revalidatePath("/admin/settings");
    revalidatePath("/api/settings"); // Forzamos el refresco del "grifo" público
    revalidatePath("/buzon");
  } catch (error) {
    console.error("Error al guardar ajustes:", error);
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
  const fields = ["name", "welcomeMessage", "infoMessage", "systemInstructions", "inputPlaceholder", "fallbackMessage"];
  
  fields.forEach(field => {
    const value = formData.get(field);
    if (value !== null) updateData[field] = value as string;
  });

  const isActiveStr = formData.get("isActive");
  if (isActiveStr !== null) updateData.isActive = isActiveStr === "true";

  try {
    await prisma.chatbot.update({ 
      where: { id }, 
      data: updateData 
    });
    
    // Solo revalidamos las rutas necesarias, sin devolver objetos
    revalidatePath("/admin/chatbots");
    revalidatePath(`/chat/${id}`);
  } catch (error) {
    console.error("Error al actualizar el chatbot:", error);
    // IMPORTANTE: No ponemos "return", dejamos que la función termine sola
  }
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
// 5. ACCIONES DE DOCUMENTOS
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
  const doc = await prisma.document.create({
    data: { filename: file.name, type, knowledgeBaseId },
  });

  try {
    await processFile(buffer, file.name, type, knowledgeBaseId, doc.id);
  } catch (error) {
    console.error("Error procesando archivo:", error);
  }
  revalidatePath(`/admin/knowledge/${knowledgeBaseId}`);
}

// --- AQUÍ ESTÁ LA PIEZA QUE REPARARÁ EL ERROR ROJO ---
export async function addUrlDocument(formData: FormData) {
  const url = formData.get("url") as string;
  const knowledgeBaseId = formData.get("knowledgeBaseId") as string;
  if (!url || !knowledgeBaseId) return;

  const doc = await prisma.document.create({
    data: { filename: url, type: "URL", knowledgeBaseId },
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

// ==========================================
// 6. RESPALDO Y RESTAURACIÓN
// ==========================================
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
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==========================================
// 7. BUZÓN INTELIGENTE SUBIDA DE ARCHIVOS
// ==========================================
// --- ACCIÓN PARA EL BUZÓN CON SUBIDA DE ARCHIVOS ---
export async function createTicket(formData: FormData) {
  const type = formData.get("type") as string;
  const content = formData.get("content") as string;
  const studentName = formData.get("studentName") as string;
  const studentEmail = formData.get("studentEmail") as string; // Añadimos email
  const file = formData.get("evidence") as File; // Recogemos el archivo del clip

  if (!content || !type) return;

  let evidenceUrl = null;

  // Lógica para subir a Supabase Storage si hay un archivo
  if (file && file.size > 0) {
    try {
      const fileName = `${Date.now()}-${file.name}`;
      // Usamos el cliente de Supabase (aquí podrías necesitar importar tu configuración de Supabase)
      // Pero para no complicarte, si ya tenemos las URLs en el .env, Prisma puede ayudar
      // o usaremos un pequeño truco de fetch para el Storage de Supabase.
      
      console.log(`📎 Subiendo evidencia: ${fileName}`);
      // Nota: Esta parte la simplificaremos guardando el nombre para la Fase Beta II
      // Para un despegue inmediato hoy, guardaremos que 'SÍ TIENE EVIDENCIA'
      evidenceUrl = `Pendiente de proceso: ${file.name}`;
    } catch (e) {
      console.error("Fallo al procesar archivo:", e);
    }
  }

  try {
    await prisma.ticket.create({
      data: {
        type,
        content,
        studentName: studentName || "Anónimo",
        studentEmail: studentEmail || null,
        evidenceUrl: evidenceUrl,
        status: "PENDIENTE",
      },
    });
    revalidatePath("/admin/buzon");
  } catch (error) {
    console.error("Error al enviar ticket:", error);
  }
}