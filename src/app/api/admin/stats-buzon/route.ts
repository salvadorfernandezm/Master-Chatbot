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

    // Función auxiliar para contar por categoría y estado
    const getStats = async (cat: string) => {
      const res = await prisma.ticket.count({ where: { category: cat, status: "RESUELTO" } });
      const ape = await prisma.ticket.count({ where: { category: cat, status: "APELADO" } });
      const neg = await prisma.ticket.count({ where: { category: cat, status: "NO ATENDIDO EN TIEMPO" } });
      return { resueltos: res, apelados: ape, noAtendidos: neg };
    };

    const autoridades = {
      academica: await getStats("ACADEMICO"),
      logistica: await getStats("LOGISTICA"),
      direccion: await getStats("GRAVE"),
      tecnico: await prisma.ticket.count({ where: { type: "SOPORTE_TECNICO", status: "RESUELTO" } }),
    };

    return NextResponse.json({
      resumen: { total, pendientes, resueltos, apelados, noAtendidos },
      autoridades,
      settings
    });
  } catch (error) {
    return NextResponse.json({ error: "Fallo" }, { status: 500 });
  }
}