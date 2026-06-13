"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { processFile, processUrl } from "@/lib/documentProcessor";
import { randomBytes } from "crypto";
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// 1. INICIALIZACIÓN DE CLIENTES
const resend = new Resend(process.env.RESEND_API_KEY);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// ==========================================
// 1. GESTIÓN DEL BUZÓN (Tickets y Evidencias)
// ==========================================

// --- 1. FUNCIÓN PARA EL ALUMNO (Crear Reporte) ---
export async function createTicket(formData: FormData): Promise<{ success: boolean; folio: string }> {
  const type = formData.get("type") as string;
  const content = formData.get("content") as string;
  const studentName = formData.get("studentName") as string;
  const studentEmail = formData.get("studentEmail") as string;
  const files = formData.getAll("evidence") as File[]; 

  if (!content || !type) return { success: false, folio: "" };

  const folio = `ETH-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  try {
    const ticket = await prisma.ticket.create({
      data: {
        folio,
        type,
        content,
        studentName: studentName || "Anónimo Protegido",
        studentEmail: studentEmail || null,
        status: "PENDIENTE",
      },
    });

   if (supabase) {
      for (const file of files) {
        if (file.size > 0) {
          const fileExt = file.name.split('.').pop();
          const fileName = `student/${ticket.id}-${Date.now()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from('evidencias').upload(fileName, file);
          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage.from('evidencias').getPublicUrl(fileName);
            await prisma.attachment.create({
              data: { url: publicUrl, name: file.name, type: "STUDENT", ticketId: ticket.id }
            });
          }
        }
      }
    }
     revalidatePath("/admin/buzon");
    // RETORNO DE ÉXITO: Siempre mandamos el folio
    return { success: true, folio: ticket.folio };

  } catch (error) {
    console.error("Error al crear ticket:", error);
    // RETORNO DE FALLO: Mandamos un texto vacío para que setFolio no llore
    return { success: false, folio: "" };
  }
}

// --- 2. FUNCIÓN PARA LA AUTORIDAD (Responder Reporte) ---
export async function submitAuthorityResponse(formData: FormData) {
  const id = formData.get("id") as string;
  const responseText = formData.get("responseText") as string;
  const files = formData.getAll("evidence") as File[];

  try {
    await prisma.ticket.update({
      where: { id },
      data: { 
        authorityResponse: responseText, 
        status: "RESUELTO", 
        updatedAt: new Date() 
      },
    });

    if (supabase) {
      for (const file of files) {
        if (file.size > 0) {
          const fileExt = file.name.split('.').pop();
          const fileName = `authority/${id}-${Date.now()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from('evidencias').upload(fileName, file);
          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage.from('evidencias').getPublicUrl(fileName);
            await prisma.attachment.create({
              data: { url: publicUrl, name: file.name, type: "AUTHORITY", ticketId: id }
            });
          }
        }
      }
    }
    revalidatePath("/admin/buzon");
    revalidatePath("/admin/directora");
    revalidatePath("/seguimiento");
    return { success: true };
  } catch (error) { 
    return { success: false }; 
  }
}

export async function setStudentSatisfaction(id: string, satisfied: boolean) {
  try {
    await prisma.ticket.update({ where: { id }, data: { studentResolved: satisfied } });
    revalidatePath("/seguimiento");
    return { success: true };
  } catch (error) { return { success: false }; }
}

export async function updateTicketStatus(id: string, newStatus: string) {
  await prisma.ticket.update({ where: { id }, data: { status: newStatus } });
  revalidatePath("/admin/buzon");
}

// ==========================================
// 2. GESTIÓN DE CHATBOTS Y GRUPOS
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
  const manualToken = formData.get("manualToken") as string;
  const token = manualToken?.trim() || randomBytes(4).toString("hex");
  await prisma.chatbot.create({ data: { name, token, groupId, knowledgeBaseId } });
  revalidatePath("/admin/chatbots");
}

export async function updateChatbot(formData: FormData) {
  const id = formData.get("id") as string;
  const updateData: any = {};
  const fields = ["name", "welcomeMessage", "systemInstructions", "inputPlaceholder", "fallbackMessage", "infoMessage", "logoUrl"];
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
// 3. GESTIÓN DE CONOCIMIENTO (Bases, Archivos y URLs)
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

// AQUÍ ESTÁ LA QUE FALTABA:
export async function addUrlDocument(formData: FormData) {
  const url = formData.get("url") as string;
  const knowledgeBaseId = formData.get("knowledgeBaseId") as string;
  if (!url || !knowledgeBaseId) return;

  const doc = await prisma.document.create({
    data: { filename: url, type: "URL", knowledgeBaseId }
  });

  await processUrl(url, knowledgeBaseId, doc.id);
  revalidatePath(`/admin/knowledge/${knowledgeBaseId}`);
}

// ==========================================
// 4. CONFIGURACIÓN, SEGURIDAD Y RESPALDO
// ==========================================

export async function verifyDirectorPin(pin: string) {
  return pin === process.env.DIRECTOR_PIN;
}

export async function updateSettings(formData: FormData) {
  const organizationName = formData.get("organizationName") as string;
  const organizationLogo = formData.get("organizationLogo") as string;
  const organizationBuzonInfo = formData.get("organizationBuzonInfo") as string;
  const isBuzonActive = formData.get("isBuzonActive") === "true";
  const settings = await prisma.settings.findFirst();
  if (settings) await prisma.settings.update({ where: { id: settings.id }, data: { organizationName, organizationLogo, organizationBuzonInfo, isBuzonActive } });
  else await prisma.settings.create({ data: { organizationName, organizationLogo, organizationBuzonInfo, isBuzonActive } });
  revalidatePath("/admin/settings");
}

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