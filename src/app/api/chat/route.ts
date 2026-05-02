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

    // 1. CARGA DE CONTEXTO OPTIMIZADA
    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    // Bajamos a 15 para evitar saturar el prompt
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 15);
    const contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n---\n\n");

    const systemPrompt = `Eres el asistente académico del Profesor Salvador Fernández. 
    Usa este CONTEXTO para responder:
    ${contextText}

    INSTRUCCIONES:
    - Si preguntan por Xabier Etxeberria o APA, explica pedagógicamente.
    - Si piden notas, calcula el promedio normalizando la escala (Base 12 -> divide 1.2 | Base 5 -> multiplica 2).
    - Responde de forma concisa para evitar errores de saturación.`;

    // 2. CONEXIÓN ESTABLE
    const modelName = "gemini-1.5-flash"; 
    const url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nPregunta: " + message }] }],
        safetySettings: [
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" }
        ],
        generationConfig: { temperature: 0.1, maxOutputTokens: 1000 }
      })
    });

    const data = await response.json();

    // 3. VALIDACIÓN DE RESPUESTA
    if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
      const reply = data.candidates[0].content.parts[0].text;
      return NextResponse.json({ reply });
    } else {
      console.error("Fallo de Google:", JSON.stringify(data));
      return NextResponse.json({ reply: "Google está procesando la sabiduría del Dr. Xabier. Por favor, reintenta tu pregunta en 5 segundos." });
    }

  } catch (error: any) {
    return NextResponse.json({ error: "Sincronizando... " + error.message }, { status: 500 });
  }
}