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
    console.log("🚀 EJECUTANDO RAG CHAT VERSIÓN FINAL (8b)");
    console.log("-----------------------------------------");

    if (!apiKey) return NextResponse.json({ error: "Falta API Key" }, { status: 500 });

    const chatbot = await prisma.chatbot.findUnique({
      where: { token, isActive: true },
      include: { knowledgeBase: true }
    });

    if (!chatbot) return NextResponse.json({ error: "Chatbot no encontrado" }, { status: 404 });

    // CARGAR CONTEXTO
    let contextText = "No hay documentos cargados.";
    try {
        await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
        const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 15);
        if (vectorContexts && vectorContexts.length > 0) {
            contextText = vectorContexts.map(v => v?.pageContent || "").join("\n\n---\n\n");
        }
    } catch (err) {
        console.warn("Error en búsqueda:", err.message);
    }

    const systemPrompt = `Eres un asistente académico. Usa este contexto: ${contextText}. Responde de forma directa.`;

    // USAMOS EL MODELO 8B (EL QUE SIEMPRE TIENE CUOTA)
    const modelName = "gemini-1.5-flash-8b"; 
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
        throw new Error(data.error?.message || "Error de Google");
    }

    const reply = data.candidates[0].content.parts[0].text;
    
    await prisma.interaction.create({
      data: { chatbotId: chatbot.id, query: message, response: reply }
    }).catch(() => {});

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("❌ FALLO:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}