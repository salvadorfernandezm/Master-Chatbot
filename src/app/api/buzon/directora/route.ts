import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const hace15Dias = new Date();
hace15Dias.setDate(hace15Dias.getDate() - 15);

const tickets = await prisma.ticket.findMany({
  where: {
 AND: [
          { NOT: { type: 'SOPORTE_TECNICO' } }, // No ve fallos técnicos
          {
    OR: [
      { status: "PENDIENTE" },
      { status: "APELADO" }, // Los apelados siempre visibles
      { 
        status: "RESUELTO", 
        updatedAt: { gte: hace15Dias } 
      }
    ]
  },
  include: { attachments: true },
  orderBy: { updatedAt: 'desc' } // Ordenar por lo más reciente que se movió
});
    return NextResponse.json(tickets);
  } catch (error) {
    return NextResponse.json({ error: "Fallo" }, { status: 500 });
  }
}