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
    if (!chatbot) return NextResponse.json({ error: "No hay chatbot" }, { status: 404 });

    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 30);
    const contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n---\n\n");

    const systemPrompt = `Eres el asistente oficial del Profesor Salvador Fernández.
    TU ÚNICA FUENTE DE DATOS (RECIÉN EXTRAÍDOS):
    ${contextText}

    INSTRUCCIONES DE SEGURIDAD:
    - Solo da notas si ves un CORREO en la pregunta y ese correo está en los datos.
    - Los datos vienen en formato: "REGISTRO ACADÉMICO - FILA X: Nombre, Correo, Notas..."
    - Si el correo coincide, di la nota de cada actividad de forma literal.
    - REGLA DE ORO: No digas que no tienes acceso. El texto de arriba SON los archivos.`;

    const modelName = "gemini-flash-latest"; // Usamos el alias más potente
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nPregunta: " + message }] }],
        safetySettings: [{ category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }]
      })
    });

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Lo siento, no pude procesar la respuesta. Intenta con tu nombre o correo otra vez.";

    return NextResponse.json({ reply });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}