import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const hace15Dias = new Date();
    hace15Dias.setDate(hace15Dias.getDate() - 15);

    const tickets = await prisma.ticket.findMany({
      where: {
        AND: [
          { NOT: { type: 'SOPORTE_TECNICO' } }, // SOLO EN DIRECTORA. En Admin quita esta línea.
          {
            OR: [
              { status: "PENDIENTE" },
              { status: "APELADO" },
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
orderBy: { createdAt: 'desc' } // Aseguramos el orden aquí también
    });
    return NextResponse.json(tickets);
  } catch (error) {
    return NextResponse.json({ error: "Fallo" }, { status: 500 });
  }
}