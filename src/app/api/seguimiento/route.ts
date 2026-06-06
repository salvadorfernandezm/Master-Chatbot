import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const folio = searchParams.get("folio");

  if (!folio) return NextResponse.json({ error: "Folio requerido" }, { status: 400 });

  const ticket = await prisma.ticket.findUnique({
    where: { folio: folio.toUpperCase() },
    select: {
      id: true, // <--- ¡ESTA ES LA PIEZA CLAVE!
      content: true,
      status: true,
      authorityResponse: true,
      createdAt: true
    }
  });

  if (!ticket) return NextResponse.json({ error: "No se encontró ningún reporte" }, { status: 404 });

  return NextResponse.json(ticket);
}