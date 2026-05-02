export const dynamic = 'force-dynamic';
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { prisma } from "@/lib/prisma";
import { searchVectorStore, loadStoreFromDB } from "@/lib/vectorStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, token } = body;
    const apiKey = process.env.GEMINI_API_KEY;

    const chatbot = await prisma.chatbot.findUnique({
      where: { token, isActive: true }
    });

    if (!chatbot) return NextResponse.json({ error: "Chatbot no encontrado" }, { status: 404 });

    // CARGAMOS DATOS DE SUPABASE
    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 25);
    const contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n---\n\n");

    const systemPrompt = `Eres el asistente académico del Profesor Salvador Fernández.
    REGLA: Usa este CONTEXTO para responder. Si no hay datos, pregunta nombre o correo.
    
    CONTEXTO DE DATOS:
    ${contextText}
    
    TAREA: Si el usuario da un correo (como alondrafatimacasas@gmail.com), busca esa línea en el CONTEXTO y dale TODAS las notas que aparezcan ahí de forma literal.`;

    const modelName = "gemini-flash-latest"; 
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
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No encuentro tu registro. Intenta de nuevo por favor.";

    return NextResponse.json({ reply });

  } catch (error: any) {
    return NextResponse.json({ error: "Sincronizando: " + error.message }, { status: 500 });
  }
}