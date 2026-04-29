export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Obtenemos los últimos 30 días para la gráfica
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const interactions = await prisma.interaction.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      include: {
        chatbot: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Si no hay interacciones, enviamos un array vacío pero con estructura
    return NextResponse.json(interactions);
  } catch (error: any) {
    console.error("Error en API de analíticas:", error.message);
    return NextResponse.json({ error: "Error al cargar datos" }, { status: 500 });
  }
}