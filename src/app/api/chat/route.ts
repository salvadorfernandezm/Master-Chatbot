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

    // 1. CARGA DE CONTEXTO
    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 15);
    const contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n");

    const systemPrompt = `Eres un asistente académico. Contexto: ${contextText}. Responde directo y breve.`;

    // 2. LISTA DE MODELOS A PROBAR (En orden de probabilidad de éxito)
    const modelsToTry = [
      "gemini-2.0-flash-lite",  // El más probable con cuota libre
      "gemini-2.5-flash-lite",  // El futuro "Lite"
      "gemini-1.5-flash",       // El clásico
    ];

    let lastError = "";

    for (const modelName of modelsToTry) {
      console.log(`📡 Probando "gasolina" en el modelo: ${modelName}`);
      
      // Intentamos con v1beta que es donde están los Lite
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt + "\n\nPregunta: " + message }] }],
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" }
          ]
        })
      });

      const data = await response.json();

      if (response.ok && data.candidates && data.candidates[0].content) {
        const reply = data.candidates[0].content.parts[0].text;
        return NextResponse.json({ reply });
      } else {
        lastError = data.error?.message || "Error desconocido";
        console.warn(`⚠️ Modelo ${modelName} sin cuota o no encontrado. Pasando al siguiente...`);
      }
    }

    // Si llegamos aquí, ninguno funcionó
    return NextResponse.json({ 
        reply: `⚠️ Lo siento, Salvador. Google indica: "${lastError}". Esto suele significar que el modelo está saturado. Por favor, reintenta en un minuto.` 
    });

  } catch (error: any) {
    return NextResponse.json({ error: "Fallo técnico: " + error.message }, { status: 500 });
  }
}