import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { runEscalationLogic } from "@/lib/actions";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("view"); // Capturamos si queremos ver archivados

  try {
    await runEscalationLogic();
    
    if (mode === "archived") {
      // SOLO LOS ARCHIVADOS
      const archived = await prisma.ticket.findMany({
        where: { status: "ARCHIVADO" },
        include: { attachments: true },
        orderBy: { updatedAt: 'desc' }
      });
      return NextResponse.json(archived);
    }

    // LISTADO NORMAL (Lo que ya teníamos)
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
              { AND: [{ status: "RESUELTO" }, { updatedAt: { gte: hace15Dias } }] }
            ]
          }
        ]
      },
      include: { attachments: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(tickets);
  } catch (error) { return NextResponse.json({ error: "Fallo" }, { status: 500 }); }
}