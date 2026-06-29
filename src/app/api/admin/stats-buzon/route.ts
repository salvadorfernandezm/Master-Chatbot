import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [total, pendientes, resueltos, apelados, noAtendidos, settings] = await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: "PENDIENTE" } }),
      prisma.ticket.count({ where: { status: "RESUELTO" } }),
      prisma.ticket.count({ where: { status: "APELADO" } }),
      prisma.ticket.count({ where: { status: "NO ATENDIDO EN TIEMPO" } }),
      prisma.settings.findFirst()
    ]);

    const statsAutoridad = {
      academica: await prisma.ticket.count({ where: { category: "ACADEMICO", status: "RESUELTO" } }),
      logistica: await prisma.ticket.count({ where: { category: "LOGISTICA", status: "RESUELTO" } }),
      direccion: await prisma.ticket.count({ where: { category: "GRAVE", status: "RESUELTO" } }),
      tecnico: await prisma.ticket.count({ where: { type: "SOPORTE_TECNICO", status: "RESUELTO" } }),
    };

    return NextResponse.json({
      resumen: { total, pendientes, resueltos, apelados, noAtendidos },
      autoridades: statsAutoridad,
      settings: settings // <-- Esto es vital para que la página vea los nombres
    });
  } catch (error) {
    return NextResponse.json({ error: "Fallo" }, { status: 500 });
  }
}