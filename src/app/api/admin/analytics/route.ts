export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Todas las interacciones con su chatbot
    const interactions = await prisma.interaction.findMany({
      orderBy: { createdAt: "asc" },
      include: { chatbot: { select: { name: true } } },
    });

    // 2. Consultas por día (últimos 30 días)
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const queriesByDay: Record<string, number> = {};
    interactions
      .filter((i) => new Date(i.createdAt) >= last30Days)
      .forEach((i) => {
        const day = new Date(i.createdAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
        queriesByDay[day] = (queriesByDay[day] || 0) + 1;
      });

    const queriesByDayArray = Object.entries(queriesByDay).map(([date, count]) => ({ date, count }));

    // 3. Consultas por chatbot (top bots)
    const queriesByBot: Record<string, number> = {};
    interactions.forEach((i) => {
      const name = i.chatbot.name;
      queriesByBot[name] = (queriesByBot[name] || 0) + 1;
    });

    const queriesByBotArray = Object.entries(queriesByBot)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // 4. Datos completos para CSV
    const csvData = interactions.map((i) => ({
      fecha: new Date(i.createdAt).toLocaleString("es-MX"),
      chatbot: i.chatbot.name,
      pregunta: i.query,
      respuesta: i.response.replace(/\n/g, " ").slice(0, 300),
    }));

    return NextResponse.json({
      totalInteractions: interactions.length,
      queriesByDay: queriesByDayArray,
      queriesByBot: queriesByBotArray,
      csvData,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
