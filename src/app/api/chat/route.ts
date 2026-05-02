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
    if (!chatbot) return NextResponse.json({ error: "Chatbot no encontrado" }, { status: 404 });

    // 1. CARGA DE DATOS
    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 15);
    const contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n---\n\n");

    const systemPrompt = `ACTÚA COMO UN INVESTIGADOR UNIVERSITARIO.
    Usa este CONTEXTO DOCUMENTAL:
    ${contextText}

    TAREA:
    Responde con precisión académica. Si son notas, calcúlalas (Base 12 divide entre 1.2). 
    Si es teoría (Dr. Xabier), explícala con detalle pedagógico.
    REGLA: Responde siempre de forma completa y amable.`;

    // 2. ESTRATEGIA DE MODELOS (USANDO EL LITE QUE TIENE CUOTA)
    // El modelo 'gemini-2.0-flash-lite' es el que SÍ tiene los 1,500 mensajes
    const modelName = "gemini-2.0-flash-lite"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    console.log(`📡 Solicitando acceso vía modelo LITE: ${modelName}`);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nUSUARIO: " + message }] }],
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ],
        generationConfig: { 
            temperature: 0.2, 
            maxOutputTokens: 2500 // Permitimos respuestas largas para Etxeberria
        }
      })
    });

    const data = await response.json();

    if (data.candidates && data.candidates[0]?.content) {
      const reply = data.candidates[0].content.parts[0].text;
      
      // Guardar analíticas (opcional pero recomendado)
      await prisma.interaction.create({
        data: { chatbotId: chatbot.id, query: message.substring(0,500), response: reply.substring(0,2500) }
      }).catch(() => {});

      return NextResponse.json({ reply });
    } else {
      // SI FALLA EL LITE, MANDAMOS UN ERROR REAL QUE PODAMOS ENTENDER
      const errorMsg = data.error?.message || "Límite alcanzado o error de seguridad.";
      console.error("Fallo de Google:", JSON.stringify(data));
      return NextResponse.json({ reply: `⚠️ Nota académica: El servidor indica "${errorMsg}". Intenta simplificar la pregunta o espera unos segundos.` });
    }

  } catch (error: any) {
    return NextResponse.json({ error: "Sincronizando sabiduría... " + error.message }, { status: 500 });
  }
}