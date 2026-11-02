"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "");

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

    const files = formData.getAll("evidence");
    for (const file of files) {
      const f = file as any;
      if (f.size > 0) {
        const cleanName = f.name.replace(/[^a-zA-Z0-9.]/g, "_");
        const fileName = `student/${ticket.id}-${Date.now()}-${cleanName}`;
        const { error } = await supabase.storage.from('evidencias').upload(fileName, Buffer.from(await f.arrayBuffer()), { contentType: f.type, upsert: true });
        if (!error) {
          const { data: { publicUrl } } = supabase.storage.from('evidencias').getPublicUrl(fileName);
          attachmentLinks.push(publicUrl);
          await prisma.attachment.create({ data: { url: publicUrl, name: f.name, type: "STUDENT", ticketId: ticket.id } });
        }
      }
    }
    // Envíos de correo aquí (omito por brevedad, pero van incluidos en tu lógica real)
    revalidatePath("/admin/buzon");
    return { success: true, folio: ticket.folio };
  } catch (error) { return { success: false, folio: "" }; }
}

export async function submitAppeal(id: string, reason: string) {
  const currentTicket = await prisma.ticket.findUnique({ where: { id } });
  const newHistory = `[RESPUESTA]: ${currentTicket?.authorityResponse}\n\n[APELACIÓN]: ${reason}`;
  await prisma.ticket.update({ where: { id }, data: { status: "APELADO", authorityResponse: newHistory } });
  revalidatePath("/seguimiento"); return { success: true };
}

export async function submitAuthorityResponse(formData: FormData) {
  const id = formData.get("id") as string;
  const responseText = formData.get("responseText") as string;
  await prisma.ticket.update({ where: { id }, data: { authorityResponse: responseText, status: "RESUELTO", updatedAt: new Date() } });
  revalidatePath("/admin/buzon"); revalidatePath("/seguimiento"); return { success: true };
}

export async function updateTicketStatus(id: string, newStatus: string) {
  await prisma.ticket.update({ where: { id }, data: { status: newStatus } });
  revalidatePath("/admin/buzon");
  revalidatePath("/admin/directora");
}

export async function setStudentSatisfaction(id: string, satisfied: boolean) {
  await prisma.ticket.update({ where: { id }, data: { studentResolved: satisfied } });
  revalidatePath("/seguimiento"); return { success: true };
}