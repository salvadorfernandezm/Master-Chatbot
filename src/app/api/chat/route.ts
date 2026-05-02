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

    // CARGAMOS TODO EL CONTEXTO
    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 40); // Más fragmentos para no fallar
    const contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n---\n\n");

    const systemPrompt = `Eres el asistente oficial del Profesor Salvador. 
    A CONTINUACIÓN TIENES LA BASE DE DATOS (LECTURAS, APA Y CALIFICACIONES):
    ${contextText}

    IDENTIFICA TU MISIÓN:
    1. SI preguntan por CALIFICACIONES (notas, promedios, nombres de alumnos):
       - Solo entonces pide nombre o correo. 
       - Si lo tienes, normaliza la nota (Base 12 / 1.2 o Base 5 * 2) y da el promedio.
    2. SI preguntan por FILOSOFÍA O APA (Etxeberria, Moral, Citas, etc):
       - Responde como un profesor experto basándote en los textos de arriba. 
       - ¡PROHIBIDO pedir nombre o correo en este modo teórico!
    3. REGLA DE ORO: No digas que no tienes acceso. Si no ves el dato exacto, resume lo más parecido que encuentres.`;

    const modelName = "gemini-2.0-flash-lite"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nPregunta: " + message }] }],
        safetySettings: [
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ],
        generationConfig: { temperature: 0.2, maxOutputTokens: 2500 }
      })
    });

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Lo siento, tuve un problema al procesar los archivos. Por favor, sé más específico con tu pregunta.";

    return NextResponse.json({ reply });

  } catch (error: any) {
    return NextResponse.json({ error: "Sincronizando: " + error.message }, { status: 500 });
  }
}