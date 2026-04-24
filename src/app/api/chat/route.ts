export const dynamic = 'force-dynamic';
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { prisma } from "@/lib/prisma";
import { searchVectorStore, loadStoreFromDB } from "@/lib/vectorStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, token } = body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) return NextResponse.json({ error: "Falta la API Key" }, { status: 500 });

    const chatbot = await prisma.chatbot.findUnique({
      where: { token, isActive: true },
    });

    if (!chatbot) return NextResponse.json({ error: "Chatbot no encontrado" }, { status: 404 });

    // 1. CARGA LIGERA DE CONTEXTO
    try {
      await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    } catch (e) {
      console.warn("Aviso: No se pudo cargar la base de datos, respondiendo con IA general.");
    }
    
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 10);
    const contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n");

    const systemPrompt = `Eres un asistente académico. Contexto: ${contextText}. Responde de forma clara.`;

    // 2. LLAMADA A GOOGLE (Modelo 2.0 Flash - El más moderno)
    const modelName = "gemini-2.0-flash"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nPregunta: " + message }] }],
        // Bajamos los filtros para evitar que las respuestas vengan vacías
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" }
        ]
      })
    });

    const data = await response.json();

    // --- DETECTOR DE RESPUESTA VACÍA (Evita el error 'reading 0') ---
    if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
        const reply = data.candidates[0].content.parts[0].text;
        return NextResponse.json({ reply });
    } else {
        // Si Google bloqueó la respuesta o falló la cuota
        const errorMsg = data.error?.message || "Google bloqueó la respuesta por seguridad o saturación.";
        return NextResponse.json({ reply: `⚠️ Nota: ${errorMsg}. Por favor, intenta con otra pregunta.` });
    }

  } catch (error: any) {
    console.error("❌ FALLO:", error.message);
    return NextResponse.json({ error: "Reintentando... " + error.message }, { status: 500 });
  }
}