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
      where: { token, isActive: true },
      include: { knowledgeBase: true }
    });

    if (!chatbot) return NextResponse.json({ error: "Chatbot no encontrado" }, { status: 404 });

    // 1. CARGAR CONTEXTO
    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 25);
    const contextText = vectorContexts.map(v => v.pageContent).join("\n\n---\n\n");

    const systemPrompt = `Eres un asistente de notas y asistencias. 
    Usa este contexto (que incluye un JSON con datos de alumnos): ${contextText}. 
    Si el alumno te da su correo, busca sus faltas ('absent') y sus notas. No inventes nada.`;

    // 2. EL MODELO "LITE" (EL DE LA CUOTA ALTA)
    // Usamos el 2.0-flash-lite que vimos en tu lista de la terminal
    const modelName = "gemini-2.0-flash-lite"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    console.log(`📡 Usando el modelo de alta capacidad: ${modelName}`);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nUsuario: " + message }] }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
        // Si el Lite también falla, es que necesitamos un Redeploy en Vercel sin caché
        throw new Error(data.error?.message || "Error de cuota");
    }

    const reply = data.candidates[0].content.parts[0].text;
    
    await prisma.interaction.create({
      data: { chatbotId: chatbot.id, query: message, response: reply }
    }).catch(() => {});

    return NextResponse.json({ reply });

  } catch (error: any) {
    return NextResponse.json({ error: "⚠️ " + error.message }, { status: 500 });
  }
}