export const dynamic = 'force-dynamic';
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { prisma } from "@/lib/prisma";
import { searchVectorStore, loadStoreFromDB } from "@/lib/vectorStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, token } = body;
    const apiKey = process.env.GEMINI_API_KEY;

    const chatbot = await prisma.chatbot.findUnique({ where: { token, isActive: true } });
    if (!chatbot) return NextResponse.json({ error: "Chatbot no encontrado" }, { status: 404 });

    // 1. CARGAR CONTEXTO
    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 25);
    const contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n---\n\n");

    const systemPrompt = `Eres el asistente académico del Prof. Salvador.
    DATOS DISPONIBLES:
    ${contextText}

    TAREA: Busca al alumno y calcula su promedio. 
    REGLA DE PONDERACIÓN: Si una nota es sobre 5, multiplícala por 2. Si es sobre 12, divídela entre 1.2. 
    Muestra el proceso. Si no hay datos, di que no los encuentras.`;

    // 2. MODELO LITE CON SEGURIDAD DESACTIVADA
    const modelName = "gemini-2.0-flash-lite"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nUsuario: " + message }] }],
        // APAGAMOS ABSOLUTAMENTE TODOS LOS FILTROS DE SEGURIDAD
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ],
        generationConfig: { temperature: 0.1 }
      })
    });

    const data = await response.json();

    // --- DETECTOR DE ERRORES REALES ---
    if (data.error) {
        return NextResponse.json({ reply: `⚠️ Error de Google: ${data.error.message}` });
    }

    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        const reply = data.candidates[0].content.parts[0].text;
        return NextResponse.json({ reply });
    } 
    
    // Si llegamos aquí, es que Google bloqueó la respuesta por otra razón
    return NextResponse.json({ 
        reply: "Google no pudo generar la respuesta (posible bloqueo de privacidad). Intenta preguntando por el nombre sin el apellido o solo por la nota de una actividad." 
    });

  } catch (error: any) {
    return NextResponse.json({ error: "Error técnico: " + error.message }, { status: 500 });
  }
}