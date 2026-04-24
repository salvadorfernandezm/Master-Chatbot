export const dynamic = 'force-dynamic';
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { prisma } from "@/lib/prisma";
import { searchVectorStore, loadStoreFromDB } from "@/lib/vectorStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, token } = body;
    const apiKey = process.env.GEMINI_API_KEY;

    console.log("-----------------------------------------");
    console.log("🚀 EJECUTANDO VERSIÓN DE RESCATE 2.0");
    console.log("-----------------------------------------");

    const chatbot = await prisma.chatbot.findUnique({
      where: { token, isActive: true },
    });

    if (!chatbot) return NextResponse.json({ error: "No hay chatbot" }, { status: 404 });

    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 10);
    const contextText = vectorContexts.map(v => v.pageContent).join("\n\n---\n\n");

    const systemPrompt = `Eres un asistente académico. Contexto: ${contextText}. Responde breve.`;

    // USAMOS EL MODELO 2.0 FLASH (Suele ser el más estable en tu cuenta)
    const modelName = "gemini-2.0-flash"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nPregunta: " + message }] }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
        console.error("❌ ERROR GOOGLE:", JSON.stringify(data));
        throw new Error(data.error?.message || "Error de cuota");
    }

    return NextResponse.json({ reply: data.candidates[0].content.parts[0].text });

  } catch (error: any) {
    return NextResponse.json({ error: "⚠️ " + error.message }, { status: 500 });
  }
}