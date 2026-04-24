export const dynamic = 'force-dynamic';
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { prisma } from "@/lib/prisma";
import { searchVectorStore, loadStoreFromDB } from "@/lib/vectorStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, token } = body;
    const apiKey = process.env.GEMINI_API_KEY;

    console.log("🚀 EJECUTANDO: VERSIÓN PRODUCCIÓN FINAL");

    const chatbot = await prisma.chatbot.findUnique({ where: { token, isActive: true } });
    if (!chatbot) return NextResponse.json({ error: "No hay chatbot" }, { status: 404 });

    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 10);
    const contextText = vectorContexts.map(v => v.pageContent).join("\n\n");

    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `CONTEXTO:\n${contextText}\n\nPREGUNTA: ${message}` }] }]
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Error");

    return NextResponse.json({ reply: data.candidates[0].content.parts[0].text });
  } catch (error: any) {
    return NextResponse.json({ error: "Procesando... reintenta en 5 segundos." }, { status: 500 });
  }
}