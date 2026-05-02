export const dynamic = 'force-dynamic';
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { prisma } from "@/lib/prisma";
import { searchVectorStore, loadStoreFromDB } from "@/lib/vectorStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, token } = body;
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!apiKey) return NextResponse.json({ error: "Falta API Key" }, { status: 500 });

    const chatbot = await prisma.chatbot.findUnique({
      where: { token, isActive: true },
    });
    if (!chatbot) return NextResponse.json({ error: "Chatbot no encontrado" }, { status: 404 });

    // CARGAR DATOS
    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 12);
    const contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n");

    const systemPrompt = `Eres un asistente académico. Contexto:\n${contextText}\n\nResponde basado en los datos.`;

    // --- CADENA DE SUPERVIVENCIA (INTENTO DE MODELOS DISPONIBLES) ---
    // Usamos los nombres exactos que aparecieron en tu lista de la terminal
    const modelsToTry = [
      "gemini-2.0-flash-lite", // 1er Intento: El que debe tener cuota alta
      "gemini-2.5-flash-lite", // 2do Intento: El modelo de estreno
      "gemini-2.0-flash"      // 3er Intento: Por si los Lite están ocupados
    ];

    let lastError = "";

    for (const modelName of modelsToTry) {
      console.log(`📡 Intentando conectar vía: ${modelName}`);
      
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt + "\n\nPregunta: " + message }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 2000 }
        })
      });

      const data = await response.json();

      if (response.ok && data.candidates?.[0]?.content) {
        const reply = data.candidates[0].content.parts[0].text;
        
        // Guardar analíticas
        await prisma.interaction.create({
          data: { chatbotId: chatbot.id, query: message.substring(0, 500), response: reply.substring(0, 2000) }
        }).catch(() => {});

        return NextResponse.json({ reply });
      } else {
        lastError = data.error?.message || "Fallo desconocido";
        console.warn(`⚠️ Modelo ${modelName} rechazado por: ${lastError}`);
        // El bucle sigue al siguiente modelo de la lista
      }
    }

    // Si llegamos aquí, es que ninguno funcionó
    return NextResponse.json({ 
        reply: `⚠️ Lo sentimos, pero Google está saturado o los modelos están en mantenimiento técnico. Error reportado: "${lastError}". Por favor, espera 30 segundos y reintenta.` 
    });

  } catch (error: any) {
    return NextResponse.json({ error: "Sincronizando: " + error.message }, { status: 500 });
  }
}