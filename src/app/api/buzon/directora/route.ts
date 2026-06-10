import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const tickets = await prisma.ticket.findMany({
  where: { NOT: { type: 'SOPORTE_TECNICO' } },
  include: {
    attachments: true // <--- ESTO LIBERA LAS FOTOS
  },
  orderBy: { createdAt: 'desc' }
});
    return NextResponse.json(tickets);
  } catch (error) {
    return NextResponse.json({ error: "Fallo" }, { status: 500 });
  }
}