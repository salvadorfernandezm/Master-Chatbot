"use server";
// ACTUALIZACIÓN DE MOTOR REAL - v1.0

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
// 1. SEGURIDAD
// ==========================================
export async function verifyDirectorPin(pin: string) {
  return pin === process.env.DIRECTOR_PIN;
}

// ==========================================
// 2. MOTOR REAL DEL BUZÓN
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
        const f = file as any; // Usamos any para evitar líos de tipos con File en el build
        if (f.size > 0) {
          const cleanName = f.name.replace(/[^a-zA-Z0-9.]/g, "_");
          const fileName = `student/${ticket.id}-${Date.now()}-${cleanName}`;
          const arrayBuffer = await f.arrayBuffer();

          const { error: uploadError } = await supabase.storage
            .from('evidencias')
            .upload(fileName, Buffer.from(arrayBuffer), {
              contentType: f.type,
              upsert: true
            });

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage.from('evidencias').getPublicUrl(fileName);
            await prisma.attachment.create({
              data: { url: publicUrl, name: f.name, type: "STUDENT", ticketId: ticket.id }
            });
          }
        }
      }
    }

    revalidatePath("/admin/buzon");
    return { success: true, folio: ticket.folio };
  } catch (error) {
    console.error("Error createTicket:", error);
    return { success: false, folio: "" };
  }
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

export async function submitAuthorityResponse(formData: FormData) {
  const id = formData.get("id") as string;
  const responseText = formData.get("responseText") as string;
  try {
    await prisma.ticket.update({
      where: { id },
      data: { authorityResponse: responseText, status: "RESUELTO" }
    });
    revalidatePath("/admin/buzon");
    return { success: true };
  } catch (error) { return { success: false }; }
}

export async function updateTicketStatus(id: string, newStatus: string) {
  await prisma.ticket.update({ where: { id }, data: { status: newStatus } });
  revalidatePath("/admin/buzon");
}

// ==========================================
// 3. CHATBOTS Y GRUPOS (MANTENIENDO EXPORTACIONES)
// ==========================================

export async function createGroup(formData: FormData) { console.log("Stub createGroup"); }
export async function updateGroup(formData: FormData) { console.log("Stub updateGroup"); }
export async function deleteGroup(id: string) { console.log("Stub deleteGroup"); }

export async function createChatbot(formData: FormData) { console.log("Stub createChatbot"); }
export async function updateChatbot(formData: FormData) { console.log("Stub updateChatbot"); }
export async function deleteChatbot(id: string) { console.log("Stub deleteChatbot"); }

export async function createKnowledgeBase(formData: FormData) { console.log("Stub createKnowledgeBase"); }
export async function updateKnowledgeBase(formData: FormData) { console.log("Stub updateKnowledgeBase"); }
export async function deleteKnowledgeBase(id: string) { console.log("Stub deleteKnowledgeBase"); }

export async function uploadFileDocument(formData: FormData) { console.log("Stub uploadFileDocument"); }
export async function deleteDocument(id: string, kbId: string) { console.log("Stub deleteDocument"); }
export async function addUrlDocument(formData: FormData) { console.log("Stub addUrlDocument"); }

// ==========================================
// 4. CONFIGURACIÓN Y BACKUP
// ==========================================

export async function updateSettings(formData: FormData) { console.log("Stub updateSettings"); }

export async function exportFullBackup() { 
  return { groups: [], chatbots: [], kbs: [], docs: [] }; 
}

export async function importFullBackup(data: any) { 
  return { success: true, error: "" }; 
}