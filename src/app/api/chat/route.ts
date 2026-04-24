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
    });

    if (!chatbot) return NextResponse.json({ error: "No hay chatbot" }, { status: 404 });

    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 25);
    const contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n---\n\n");

    console.log(`🔎 Chunks encontrados para Gemini: ${vectorContexts.length}`);

    const systemPrompt = `Eres un asistente experto. TU FUENTE DE VERDAD ES ESTA:\n${contextText}\n
    INSTRUCCIÓN: Si Alondra o cualquier alumno pregunta, busca su dato arriba. NO MIENTAS. SI NO HAY DATOS, DI: 'No veo información en los fragmentos' y menciona cuántos chunks encontraste (${vectorContexts.length})`;

    const modelName = "gemini-2.0-flash-lite"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nPregunta: " + message }] }]
      })
    });

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No obtuve respuesta de la IA.";

    return NextResponse.json({ reply });

  } catch (error: any) {
    return NextResponse.json({ error: "Fallo técnico: " + error.message }, { status: 500 });
  }
}