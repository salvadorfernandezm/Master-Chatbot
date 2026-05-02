export const dynamic = 'force-dynamic';
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { prisma } from "@/lib/prisma";
import { searchVectorStore, loadStoreFromDB } from "@/lib/vectorStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, token } = body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) return NextResponse.json({ error: "Falta API Key" }, { status: 500 });

    const chatbot = await prisma.chatbot.findUnique({ where: { token, isActive: true } });
    if (!chatbot) return NextResponse.json({ error: "No hay chatbot" }, { status: 404 });

    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 12);
    const contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n---\n\n");

    const systemPrompt = `Eres el asistente académico del Profesor Salvador. Usa este CONTEXTO: ${contextText}. Responde directo y breve.`;

    // --- LA PUERTA DE ESTABILIDAD (v1 estable) ---
    // Usamos el modelo 1.5 que es el que garantiza 1,500 mensajes con la llave de la UJED
    const modelName = "gemini-1.5-flash"; 
    const url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nPregunta: " + message }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 2000 }
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Google Saturado");

    const reply = data.candidates[0].content.parts[0].text;

    // Analíticas (importante para tu monitoreo)
    await prisma.interaction.create({
      data: { chatbotId: chatbot.id, query: message.substring(0,500), response: reply.substring(0,2000) }
    }).catch(() => {});

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("❌ FALLO:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}