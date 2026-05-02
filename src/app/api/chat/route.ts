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
    if (!chatbot) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    // SUBIMOS A 25 FRAGMENTOS para que las notas no se queden fuera por culpa del cronograma
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 25);
    const contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n---\n\n");

    const systemPrompt = `Eres el asistente oficial del Profesor Salvador. 
    A CONTINUACIÓN ESTÁN LOS DOCUMENTOS CARGADOS (Incluyen Notas y Cronograma):
    ${contextText}

    TAREA:
    - Si el usuario dice "Soy Alondra" o pregunta por calificaciones, BUSCA específicamente los bloques que digan "REGISTRO ACADÉMICO".
    - El registro dice literalmente las notas. Di cada una de forma clara.
    - RECUERDA: Si ves notas de 12, divídelas entre 1.2 para el promedio. Si son de 5, multiplícalas por 2.
    - NO menciones que no hay notas si ves los registros arriba.`;

    const modelName = "gemini-2.0-flash-lite"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nUsuario: " + message }] }],
        safetySettings: [{ category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }],
        generationConfig: { temperature: 0.1 }
      })
    });

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Lo siento, ¿podrías repetirme tu nombre o correo?";

    return NextResponse.json({ reply });

  } catch (error: any) {
    return NextResponse.json({ error: "Sincronizando: " + error.message }, { status: 500 });
  }
}