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
      include: { knowledgeBase: true }
    });

    if (!chatbot) return NextResponse.json({ error: "Chatbot no encontrado" }, { status: 404 });

    // 1. REHIDRATAR MEMORIA (Solo de su base específica)
    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 25);
    const contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n---\n\n");

    // 2. PROMPT DE ESPECIALIDAD
    const systemPrompt = `Eres el asistente académico del Profesor Salvador. 
    ESTOS SON TUS DOCUMENTOS OFICIALES PARA ESTE CHAT ESPECÍFICO:
    ${contextText || "Atención: Tu base de conocimiento está vacía actualmente."}

    INSTRUCCIÓN:
    - Responde únicamente basándote en la información de arriba.
    - Si el contexto contiene CALIFICACIONES, actúa como analista y normaliza (Base 12 / 1.2).
    - Si el contexto es sobre ETXEBERRIA o APA, sé pedagógico y detallado.
    - REGLA: Si arriba no hay información, pide amablemente los datos (como correo o tema) para buscar mejor.`;

    const modelName = "gemini-flash-latest"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nUsuario: " + message }] }],
        safetySettings: [{ category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 2500 }
      })
    });

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Lo siento, tuve un problema al procesar la respuesta. ¿Puedes reintentar ser más específico?";

    return NextResponse.json({ reply });

  } catch (error: any) {
    return NextResponse.json({ error: "Sincronizando: " + error.message }, { status: 500 });
  }
}