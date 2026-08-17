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

    const getStats = async (cat: string) => {
      const rec = await prisma.ticket.count({ where: { category: cat } });
      const res = await prisma.ticket.count({ where: { category: cat, status: "RESUELTO" } });
      const ape = await prisma.ticket.count({ where: { category: cat, status: "APELADO" } });
      const neg = await prisma.ticket.count({ where: { category: cat, status: "NO ATENDIDO EN TIEMPO" } });
      return { recibidos: rec, resueltos: res, apelados: ape, noAtendidos: neg };
    };

    // Nueva función para filtrar por programa académico (Posgrado)
    const getProgStats = async (prog: string) => {
      const rec = await prisma.ticket.count({ where: { academicProgram: prog } });
      const res = await prisma.ticket.count({ where: { academicProgram: prog, status: "RESUELTO" } });
      return { recibidos: rec, resueltos: res };
    };

    const autoridades = {
      academica: await getStats("ACADEMICO"),
      logistica: await getStats("LOGISTICA"),
      direccion: await getStats("GRAVE"),
      posgrado: await getProgStats("Posgrado"), // <--- NUEVA MÉTRICA
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