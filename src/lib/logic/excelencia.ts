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