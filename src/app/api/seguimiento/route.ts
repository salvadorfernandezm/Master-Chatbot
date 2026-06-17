import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const folio = searchParams.get("folio");

    if (!folio) return NextResponse.json({ error: "Folio requerido" }, { status: 400 });

    const ticket = await prisma.ticket.findUnique({
      where: { folio },
      include: { attachments: true }
    });

    if (!ticket) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    return NextResponse.json(ticket);
  } catch (error) {
    return NextResponse.json({ error: "Fallo" }, { status: 500 });
  }
}