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

    const chatbot = await prisma.chatbot.findUnique({
      where: { token, isActive: true },
    });

    if (!chatbot) return NextResponse.json({ error: "Chatbot no encontrado" }, { status: 404 });

    // 1. CARGA DE DATOS (RAG)
    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 15);
    const contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n");

    const systemPrompt = `Eres un asistente académico experto. Usa este contexto: ${contextText}. Responde de forma clara y directa.`;

    // 2. EL MODELO "LITE" (Aquí está la clave de los 1,500 mensajes)
    const modelName = "gemini-2.0-flash-lite"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    console.log(`📡 CONECTANDO AL MODELO DE ALTA CUOTA: ${modelName}`);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nPregunta: " + message }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 2500 }
      })
    });

    const data = await response.json();

    if (!response.ok) {
        // Si por algo este falla, este mensaje saldrá en la terminal negra
        console.error("❌ ERROR GOOGLE:", data.error?.message);
        throw new Error(data.error?.message || "Google saturado");
    }

    const reply = data.candidates[0].content.parts[0].text;

    // 3. GUARDAR ANALÍTICAS
    await prisma.interaction.create({
      data: { chatbotId: chatbot.id, query: message.substring(0, 500), response: reply.substring(0, 2000) }
    }).catch(() => {});

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("❌ FALLO CRÍTICO EN LA RUTA:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}