import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const tickets = await prisma.ticket.findMany({
      // Filtramos para que ella no vea fallos técnicos, solo denuncias
      where: { NOT: { type: 'SOPORTE_TECNICO' } },
      include: {
        attachments: true // <--- ESTO ES LO QUE "LIBERA" LAS FOTOS PARA SU PANEL
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(tickets);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener datos" }, { status: 500 });
  }
}