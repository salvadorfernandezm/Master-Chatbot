import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 1. Conteos básicos
    const total = await prisma.ticket.count();
    const pendientes = await prisma.ticket.count({ where: { status: "PENDIENTE" } });
    const resueltos = await prisma.ticket.count({ where: { status: "RESUELTO" } });
    const apelados = await prisma.ticket.count({ where: { status: "APELADO" } });
    const noAtendidos = await prisma.ticket.count({ where: { status: "NO ATENDIDO EN TIEMPO" } });

    // 2. Rendimiento por Autoridad (Basado en categorías)
    const statsAutoridad = {
      academica: await prisma.ticket.count({ where: { category: "ACADEMICO", status: "RESUELTO" } }),
      logistica: await prisma.ticket.count({ where: { category: "LOGISTICA", status: "RESUELTO" } }),
      direccion: await prisma.ticket.count({ where: { category: "GRAVE", status: "RESUELTO" } }),
      tecnico: await prisma.ticket.count({ where: { type: "SOPORTE_TECNICO", status: "RESUELTO" } }),
    };

    return NextResponse.json({
      resumen: { total, pendientes, resueltos, apelados, noAtendidos },
      autoridades: statsAutoridad
    });
  } catch (error) {
    return NextResponse.json({ error: "Error en stats" }, { status: 500 });
  }
}