"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { processFile, processUrl } from "@/lib/documentProcessor";
import { randomBytes } from "crypto";
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// ==========================================
// 1. SEGURIDAD Y ESCALAMIENTO
// ==========================================
export async function verifyDirectorPin(pin: string) {
  return pin === process.env.DIRECTOR_PIN;
}

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

// ==========================================
// 2. EXPORTACIÓN HISTÓRICA MEJORADA (Excel con Propuestas)
// ==========================================
export async function downloadFullHistory() {
  try {
    const [tickets, proposals] = await Promise.all([
      prisma.ticket.findMany({ include: { attachments: true }, orderBy: { createdAt: 'desc' } }),
      prisma.proposal.findMany({ orderBy: { createdAt: 'desc' } })
    ]);

    let csvContent = "\ufeff"; // BOM para Excel
    
    // SECCIÓN TICKETS
    csvContent += "--- REPORTE DE BUZÓN ÉTICO ---\n";
    csvContent += "Folio,Fecha,Tipo,Categoria,Autor,Estatus,Respuesta,Evidencias\n";
    tickets.forEach(t => {
      csvContent += `${t.folio},${t.createdAt.toLocaleDateString()},${t.type},${t.category || 'N/A'},${t.studentName},${t.status},"${(t.authorityResponse || '').replace(/"/g, '""')}",${t.attachments.map(a => a.url).join(" | ")}\n`;
    });

    csvContent += "\n\n--- REPORTE DE INICIATIVA DE EXCELENCIA ---\n";
    csvContent += "Fecha,Titulo,Autor,Categoria,Votos,Estatus,Propuesta Final\n";
    proposals.forEach(p => {
      csvContent += `${p.createdAt.toLocaleDateString()},"${p.title.replace(/"/g, '""')}",${p.studentName},${p.category},${p.votes},${p.status},"${p.content.replace(/"/g, '""')}"\n`;
    });

    return { success: true, data: csvContent };
  } catch (error) { return { success: false, data: "" }; }
}

// ==========================================
// 3. RESPALDO DEL SISTEMA (JSON - TODO INCLUIDO)
// ==========================================
export async function exportFullBackup() {
  const [groups, chatbots, kbs, docs, settings, proposals] = await Promise.all([
    prisma.group.findMany(),
    prisma.chatbot.findMany(),
    prisma.knowledgeBase.findMany(),
    prisma.document.findMany(),
    prisma.settings.findFirst(),
    prisma.proposal.findMany() // Añadimos propuestas al backup
  ]);
  return { groups, chatbots, kbs, docs, settings, proposals };
}

export async function importFullBackup(data: any) {
  try {
    const { groups, kbs, chatbots, proposals } = data;
    if (groups) await prisma.group.createMany({ data: groups, skipDuplicates: true });
    if (proposals) await prisma.proposal.createMany({ data: proposals, skipDuplicates: true });
    revalidatePath("/admin");
    return { success: true, error: "" };
  } catch (error: any) { return { success: false, error: error.message || "Error" }; }
}

// ==========================================
// 4. CONFIGURACIÓN (FIX INTERRUPTOR)
// ==========================================
export async function updateSettings(formData: FormData) {
  const data = {
    organizationName: formData.get("organizationName") as string,
    organizationLogo: formData.get("organizationLogo") as string,
    organizationBuzonInfo: formData.get("organizationBuzonInfo") as string,
    isBuzonActive: formData.get("isBuzonActive") === "true", // Captura real
    nameAcademica: formData.get("nameAcademica") as string,
    nameAdministrativa: formData.get("nameAdministrativa") as string,
    nameDireccion: formData.get("nameDireccion") as string,
    nameTecnico: formData.get("nameTecnico") as string,
  };

  const settings = await prisma.settings.findFirst();
  if (settings) await prisma.settings.update({ where: { id: settings.id }, data });
  else await prisma.settings.create({ data: { id: 'default', ...data } });

  revalidatePath("/admin/settings");
  revalidatePath("/buzon");
  revalidatePath("/excelencia");
}

// ==========================================
// 5. MOTOR DEL BUZÓN Y PROPUESTAS (RESTO DE FUNCIONES)
// ==========================================
export async function createTicket(formData: FormData): Promise<{ success: boolean; folio: string }> {
  export async function createTicket(formData: FormData): Promise<{ success: boolean; folio: string }> {
  const type = formData.get("type") as string;
  const category = formData.get("category") as string;
  const program = formData.get("academicProgram") as string; // <---
  const modality = formData.get("modality") as string; // <---
  const content = formData.get("content") as string;
  const studentName = formData.get("studentName") as string;
  const studentEmail = formData.get("studentEmail") as string;
const files = formData.getAll("evidence"); 
  if (!content || !type) return { success: false, folio: "" };
  const folio = `ETH-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const attachmentLinks: string[] = [];
  try {
   const ticket = await prisma.ticket.create({
    data: { 
      folio, type, category, content, 
      academicProgram: program, // <---
      modality: modality,       // <---
      studentName, studentEmail, status: "PENDIENTE" 
    },
  });
  // ...
}
    if (supabase && files.length > 0) {
      for (const file of files) {
        const f = file as any;
        if (f.size > 0) {
          const cleanName = f.name.replace(/[^a-zA-Z0-9.]/g, "_");
          const fileName = `student/${ticket.id}-${Date.now()}-${cleanName}`;
          const arrayBuffer = await f.arrayBuffer();
          await supabase.storage.from('evidencias').upload(fileName, Buffer.from(arrayBuffer), { contentType: f.type, upsert: true });
          const { data: { publicUrl } } = supabase.storage.from('evidencias').getPublicUrl(fileName);
          attachmentLinks.push(publicUrl);
          await prisma.attachment.create({ data: { url: publicUrl, name: f.name, type: "STUDENT", ticketId: ticket.id } });
        }
      }
    }
    let emailDestino = process.env.EMAIL_INGENIERO;
    const criterio = type === "SOPORTE_TECNICO" ? "SOPORTE_TECNICO" : category;
    if (criterio === "ACADEMICO") emailDestino = process.env.EMAIL_SECRETARIA_ACADEMICA;
    else if (criterio === "LOGISTICA") emailDestino = process.env.EMAIL_SECRETARIA_ADMINISTRATIVA;
    else if (criterio === "GRAVE") emailDestino = process.env.EMAIL_DIRECCION;
    if (process.env.RESEND_API_KEY && emailDestino) {
      const responderUrl = `https://master-chatbot-rho.vercel.app/admin/responder?folio=${folio}`;
      const listaEvidencias = attachmentLinks.length > 0 ? `<ul>${attachmentLinks.map(l => `<li><a href="${l}">Ver</a></li>`).join('')}</ul>` : '';
      await resend.emails.send({
        from: 'Buzon Etico <onboarding@resend.dev>',
        to: [emailDestino as string],
        subject: `Nuevo Reporte: ${folio}`,
        html: `<p>Folio: ${folio}</p><p>${content}</p>${listaEvidencias}<br/><a href="${responderUrl}">Responder aquí</a>`
      }).catch(e => console.error(e));
    }
    if (process.env.RESEND_API_KEY && studentEmail) {
      await resend.emails.send({
        from: 'Buzon Etico <onboarding@resend.dev>',
        to: [studentEmail as string],
        subject: `Confirmación de Reporte: ${folio}`,
        html: `<h2>Tu voz ha sido registrada</h2><p>Folio: <strong>${folio}</strong></p>`
      }).catch(e => console.error(e));
    }
    revalidatePath("/admin/buzon");
    return { success: true, folio: ticket.folio };
  } catch (error) { return { success: false, folio: "" }; }
}

export async function submitAppeal(id: string, reason: string) {
  try {
    const currentTicket = await prisma.ticket.findUnique({ where: { id } });
    const newHistory = `[RESPUESTA DE AUTORIDAD]: ${currentTicket?.authorityResponse || 'Sin respuesta'}\n\n[RAZÓN DE APELACIÓN]: ${reason}`;
    const updated = await prisma.ticket.update({ where: { id }, data: { status: "APELADO", authorityResponse: newHistory } });
    revalidatePath("/seguimiento"); revalidatePath("/admin/buzon"); return { success: true };
  } catch (error) { return { success: false }; }
}

export async function setStudentSatisfaction(id: string, satisfied: boolean) {
  try {
    await prisma.ticket.update({ where: { id }, data: { studentResolved: satisfied } });
    revalidatePath("/seguimiento"); return { success: true };
  } catch (error) { return { success: false }; }
}

export async function submitAuthorityResponse(formData: FormData) {
  const id = formData.get("id") as string;
  const responseText = formData.get("responseText") as string;
  const files = formData.getAll("evidence");
  try {
    const updatedTicket = await prisma.ticket.update({ where: { id }, data: { authorityResponse: responseText, status: "RESUELTO", updatedAt: new Date() } });
    if (supabase && files.length > 0) {
      for (const file of files) {
        const f = file as any;
        if (f.size > 0) {
          const fileName = `authority/${id}-${Date.now()}-${f.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
          const arrayBuffer = await f.arrayBuffer();
          await supabase.storage.from('evidencias').upload(fileName, Buffer.from(arrayBuffer), { contentType: f.type, upsert: true });
          const { data: { publicUrl } } = supabase.storage.from('evidencias').getPublicUrl(fileName);
          await prisma.attachment.create({ data: { url: publicUrl, name: f.name, type: "AUTHORITY", ticketId: id } });
        }
      }
    }
    revalidatePath("/admin/buzon"); revalidatePath("/seguimiento"); revalidatePath("/admin/directora"); return { success: true };
  } catch (error) { return { success: false }; }
}

export async function updateTicketStatus(id: string, newStatus: string) {
  await prisma.ticket.update({ where: { id }, data: { status: newStatus } });
  revalidatePath("/admin/buzon"); revalidatePath("/admin/directora");
}

export async function createProposal(formData: FormData) {
  try {
    const proposal = await prisma.proposal.create({
      data: {
        title: formData.get("title") as string,
        content: formData.get("content") as string,
        category: formData.get("category") as string,
        academicProgram: formData.get("academicProgram") as string, // <---
        modality: formData.get("modality") as string,               // <---
        studentName: formData.get("studentName") as string,
        studentEmail: formData.get("studentEmail") as string,
        aiFeedback: formData.get("aiFeedback") as string,
        status: "EN_REVISION"
      }
    });
    // ...
  }
}
    revalidatePath("/excelencia"); return { success: true, id: proposal.id };
  } catch (error) { return { success: false }; }
}

export async function voteProposal(id: string) {
  try {
    await prisma.proposal.update({ where: { id }, data: { votes: { increment: 1 } } });
    revalidatePath("/excelencia/mural"); return { success: true };
  } catch (error) { return { success: false }; }
}

export async function updateProposalStatus(id: string, status: string) {
  try {
    await prisma.proposal.update({ where: { id }, data: { status } });
    revalidatePath("/admin/gestion-propuestas"); revalidatePath("/excelencia/mural"); return { success: true };
  } catch (error) { return { success: false }; }
}

// FUNCIONES DE CHATBOTS (Se mantienen igual)
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
  const kbId = formData.get("knowledgeBaseId") as string;
  const token = randomBytes(4).toString("hex");
  await prisma.chatbot.create({ data: { name, token, groupId, knowledgeBaseId: kbId, isActive: true } });
  revalidatePath("/admin/chatbots");
}
export async function updateChatbot(formData: FormData) {
  const id = formData.get("id") as string;
  const updateData: any = {};
  
  // Lista de campos a actualizar, incluyendo ahora la base de conocimiento
  const fields = [
    "name", 
    "welcomeMessage", 
    "systemInstructions", 
    "inputPlaceholder", 
    "fallbackMessage", 
    "infoMessage", 
    "logoUrl",
    "knowledgeBaseId", // <--- ESTO ES LO QUE LE DEVUELVE LA MEMORIA AL BOT
    "groupId"          // De paso permitimos cambiarlo de grupo
  ];

  fields.forEach(field => {
    const value = formData.get(field);
    if (value !== null) updateData[field] = value as string;
  });

  const isActive = formData.get("isActive");
  if (isActive !== null) updateData.isActive = isActive === "true";

  await prisma.chatbot.update({ where: { id }, data: updateData });
  revalidatePath("/admin/chatbots");
}
export async function deleteChatbot(id: string) { 
  await prisma.chatbot.delete({ where: { id } });
  revalidatePath("/admin/chatbots");
}
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
  await prisma.knowledgeBase.delete({ where: { id } });
  revalidatePath("/admin/knowledge");
}
export async function uploadFileDocument(formData: FormData) { 
  const file = formData.get("file") as File;
  const kbId = formData.get("knowledgeBaseId") as string;
  if (!file || !kbId) return;
  const buffer = Buffer.from(await file.arrayBuffer());
  const doc = await prisma.document.create({ data: { filename: file.name, type: "PDF", knowledgeBaseId: kbId } });
  await processFile(buffer, file.name, "PDF", kbId, doc.id);
  revalidatePath(`/admin/knowledge/${kbId}`);
}
export async function deleteDocument(id: string, kbId: string) { 
  await prisma.documentChunk.deleteMany({ where: { documentId: id } });
  await prisma.document.delete({ where: { id } });
  revalidatePath(`/admin/knowledge/${kbId}`);
}
export async function addUrlDocument(formData: FormData) { 
  const url = formData.get("url") as string;
  const kbId = formData.get("knowledgeBaseId") as string;
  const doc = await prisma.document.create({ data: { filename: url, type: "URL", knowledgeBaseId: kbId } });
  await processUrl(url, kbId, doc.id);
  revalidatePath(`/admin/knowledge/${kbId}`);
}