"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// CONFIGURACIÓN DE CLIENTES
const resend = new Resend(process.env.RESEND_API_KEY);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// 1. SEGURIDAD
export async function verifyDirectorPin(pin: string) {
  return pin === process.env.DIRECTOR_PIN;
}

// 2. BUZÓN (MOTOR REAL RE-INSTALADO)
export async function createTicket(formData: FormData) {
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
        const f = file as File;
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
    console.error(error);
    return { success: false, folio: "" };
  }
}

// ... (Deja las demás funciones como están por ahora, las iremos rellenando una por una)