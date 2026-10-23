"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createProposal(formData: FormData) {
  const proposal = await prisma.proposal.create({
    data: {
      title: formData.get("title") as string,
      content: formData.get("content") as string,
      category: formData.get("category") as string,
      academicProgram: formData.get("academicProgram") as string || "Psicología",
      studentName: formData.get("studentName") as string || "Anónimo",
      studentEmail: formData.get("studentEmail") as string || "excelencia@ujed.mx",
      aiFeedback: formData.get("aiFeedback") as string,
      status: "EN_REVISION"
    }
  });
  revalidatePath("/excelencia"); return { success: true, id: proposal.id };
}

export async function voteProposal(id: string) {
  await prisma.proposal.update({ where: { id }, data: { votes: { increment: 1 } } });
  revalidatePath("/excelencia/mural"); return { success: true };
}

export async function updateProposalStatus(id: string, status: string) {
  await prisma.proposal.update({ where: { id }, data: { status } });
  revalidatePath("/admin/gestion-propuestas"); return { success: true };
}

export async function updateSettings(formData: FormData) {
  const data = {
    organizationName: formData.get("organizationName") as string,
    organizationLogo: formData.get("organizationLogo") as string,
    organizationBuzonInfo: formData.get("organizationBuzonInfo") as string,
    isBuzonActive: formData.get("isBuzonActive") === "true",
    nameAcademica: formData.get("nameAcademica") as string,
    nameAdministrativa: formData.get("nameAdministrativa") as string,
    nameDireccion: formData.get("nameDireccion") as string,
    nameTecnico: formData.get("nameTecnico") as string,
  };
  const settings = await prisma.settings.findFirst();
  if (settings) await prisma.settings.update({ where: { id: settings.id }, data });
  else await prisma.settings.create({ data: { id: 'default', ...data } });
  revalidatePath("/admin/settings"); revalidatePath("/buzon");
}

export async function downloadFullHistory() {
  const [tickets, proposals] = await Promise.all([prisma.ticket.findMany(), prisma.proposal.findMany()]);
  let csv = "\ufeffFolio,Fecha,Autor,Estatus\n";
  tickets.forEach(t => { csv += `${t.folio},${t.createdAt.toLocaleDateString()},${t.studentName},${t.status}\n`; });
  return { success: true, data: csv };
}

export async function downloadChatInteractions(chatbotId: string) {
  const data = await prisma.interaction.findMany({ where: { chatbotId }, orderBy: { createdAt: 'desc' } });
  let csv = "\ufeffFecha,Estudiante,Pregunta,Respuesta\n";
  data.forEach(i => { csv += `${i.createdAt.toLocaleDateString()},${i.studentName || "Anónimo"},"${i.query.replace(/"/g, '""')}","${i.response.replace(/"/g, '""')}"\n`; });
  return { success: true, data: csv };
}

export async function exportFullBackup() {
  const [groups, chatbots, kbs, docs, settings, proposals] = await Promise.all([
    prisma.group.findMany(), prisma.chatbot.findMany(), prisma.knowledgeBase.findMany(), prisma.document.findMany(), prisma.settings.findFirst(), prisma.proposal.findMany()
  ]);
  return { groups, chatbots, kbs, docs, settings, proposals };
}

export async function importFullBackup(data: any) {
  const { groups, kbs, chatbots, proposals } = data;
  if (groups) await prisma.group.createMany({ data: groups, skipDuplicates: true });
  if (proposals) await prisma.proposal.createMany({ data: proposals, skipDuplicates: true });
  revalidatePath("/admin"); return { success: true, error: "" };
}