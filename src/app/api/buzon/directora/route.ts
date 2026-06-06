import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const tickets = await prisma.ticket.findMany({
      where: { 
        NOT: { type: 'SOPORTE_TECNICO' } 
      },
      select: {
        id: true,
        folio: true,
        type: true,
        content: true,
        status: true,
        authorityResponse: true,   // Traer respuesta
        authorityEvidence: true,   // Traer clip
        studentResolved: true,     // Traer voto
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(tickets);
  } catch (error) {
    return NextResponse.json({ error: "Fallo en base" }, { status: 500 });
  }
}