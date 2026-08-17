import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { runEscalationLogic } from "@/lib/actions";

export async function GET() {
  try {
    await runEscalationLogic();
    const tickets = await prisma.ticket.findMany({
      where: { academicProgram: "Posgrado" }, // <--- FILTRO MÁGICO
      include: { attachments: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(tickets);
  } catch (error) {
    return NextResponse.json({ error: "Fallo" }, { status: 500 });
  }
}