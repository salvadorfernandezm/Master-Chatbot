"use server";

// IMPORTANTE: Este archivo es el puente que une los 4 módulos
export * from "./logic/seguridad";
export * from "./logic/buzon";
export * from "./logic/chatbots";
export * from "./logic/excelencia";

// Añadimos esto para asegurar que el taquígrafo y el Excel funcionen
import { prisma } from "@/lib/prisma";

export async function downloadFullHistory() {
  try {
    const [tickets, proposals] = await Promise.all([
      prisma.ticket.findMany({ include: { attachments: true }, orderBy: { createdAt: 'desc' } }),
      prisma.proposal.findMany({ orderBy: { createdAt: 'desc' } })
    ]);
    let csv = "\ufeff--- REPORTE DE BUZÓN ---\nFolio,Fecha,Autor,Estatus\n";
    tickets.forEach(t => { csv += `${t.folio},${t.createdAt.toLocaleDateString()},${t.studentName},${t.status}\n`; });
    return { success: true, data: csv };
  } catch (error) { return { success: false, data: "" }; }
}

export async function downloadChatInteractions(chatbotId: string) {
  try {
    const data = await prisma.interaction.findMany({ where: { chatbotId }, orderBy: { createdAt: 'desc' } });
    const headers = ["Fecha", "Grupo", "Estudiante", "Pregunta", "Respuesta"];
    const rows = data.map(i => [i.createdAt.toLocaleDateString(), i.studentGroup || "N/A", i.studentName || "Anónimo", `"${i.query.replace(/"/g, '""')}"`, `"${i.response.replace(/"/g, '""')}"`]);
    const csv = "\ufeff" + [headers, ...rows].map(e => e.join(",")).join("\n");
    return { success: true, data: csv };
  } catch (error) { return { success: false, data: "" }; }
}