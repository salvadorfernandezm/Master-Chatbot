"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { processFile, processUrl } from "@/lib/documentProcessor";
import { randomBytes } from "crypto";
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ==========================================
// 1. GESTIÓN DEL BUZÓN (Múltiples Evidencias)
// ==========================================

export async function createTicket(formData: FormData) {
  const type = formData.get("type") as string;
  const content = formData.get("content") as string;
  const studentName = formData.get("studentName") as string;
  const studentEmail = formData.get("studentEmail") as string;
  const files = formData.getAll("evidence") as File[]; // Nota: "getAll" para varios archivos

  if (!content || !type) return { success: false, error: "Faltan datos" };
  const folio = `ETH-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  try {
    // 1. Creamos el ticket primero
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

    // 2. Subimos cada archivo al Storage y guardamos en la tabla Attachment
    for (const file of files) {
      if (file.size > 0) {
        const fileExt = file.name.split('.').pop();
        const fileName = `student/${ticket.id}-${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('evidencias')
          .upload(fileName, file);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('evidencias').getPublicUrl(fileName);
          
          await prisma.attachment.create({
            data: {
              url: publicUrl,
              name: file.name,
              type: "STUDENT",
              ticketId: ticket.id
            }
          });
        }
      }
    }

    // 3. Sistema Nervioso: Notificar por Correo
    let emailDestino = process.env.EMAIL_INGENIERO;
    if (type === "ACADEMICA") emailDestino = process.env.EMAIL_SECRETARIA_ACADEMICA;
    if (type === "LOGISTICA") emailDestino = process.env.EMAIL_SECRETARIA_ADMINISTRATIVA;
    if (type === "GRAVE") emailDestino = process.env.EMAIL_DIRECCION;

    await resend.emails.send({
      from: 'Buzon Etico <onboarding@resend.dev>',
      to: [emailDestino as string],
      subject: `Nuevo Reporte: ${folio}`,
      html: `<p>Se ha recibido un nuevo reporte tipo <strong>${type}</strong>.</p><p>Folio: ${folio}</p><a href="${process.env.NEXTAUTH_URL}/admin/buzon">Ver en Panel de Gestión</a>`
    });

    revalidatePath("/admin/buzon");
    return { success: true, folio };
  } catch (error) {
    console.error("Error en createTicket:", error);
    return { success: false };
  }
}

// RESPUESTA DE LA AUTORIDAD (Con Múltiples Evidencias)
export async function submitAuthorityResponse(formData: FormData) {
  const id = formData.get("id") as string;
  const responseText = formData.get("responseText") as string;
  const files = formData.getAll("evidence") as File[];

  if (!id || !responseText) return { success: false };

  try {
    // 1. Actualizamos el estatus y respuesta
    await prisma.ticket.update({
      where: { id },
      data: {
        authorityResponse: responseText,
        status: "RESUELTO",
        updatedAt: new Date(),
      },
    });

    // 2. Subimos evidencias de la autoridad
    for (const file of files) {
      if (file.size > 0) {
        const fileExt = file.name.split('.').pop();
        const fileName = `authority/${id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('evidencias')
          .upload(fileName, file);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('evidencias').getPublicUrl(fileName);
          
          await prisma.attachment.create({
            data: {
              url: publicUrl,
              name: file.name,
              type: "AUTHORITY",
              ticketId: id
            }
          });
        }
      }
    }

    revalidatePath("/admin/buzon");
    revalidatePath("/seguimiento");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

// ==========================================
// 2. RESTO DE FUNCIONES (Siguen igual)
// ==========================================

export async function updateTicketStatus(id: string, newStatus: string) {
  await prisma.ticket.update({ where: { id }, data: { status: newStatus } });
  revalidatePath("/admin/buzon");
}

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
}

// ... Mantén el resto de funciones (createChatbot, createGroup, etc.) igual que las tenías