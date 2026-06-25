import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { runEscalationLogic } from "@/lib/actions";

export async function GET() {
  try {
    // 1. Despertamos al "vigilante"
    await runEscalationLogic();

    const hace15Dias = new Date();
    hace15Dias.setDate(hace15Dias.getDate() - 15);

    const tickets = await prisma.ticket.findMany({
      where: {
        AND: [
          { NOT: { status: "ARCHIVADO" } },
          {
            OR: [
              { status: "PENDIENTE" },
              { status: "APELADO" },
              { status: "NO ATENDIDO EN TIEMPO" },
              {
                AND: [
                  { status: "RESUELTO" },
                  { updatedAt: { gte: hace15Dias } }
                ]
              }
            ]
          }
        ]
      },
      include: { attachments: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(tickets);
  } catch (error) {
    return NextResponse.json({ error: "Fallo" }, { status: 500 });
  }
}