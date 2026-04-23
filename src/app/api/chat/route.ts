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

    // 1. CARGAR CONTEXTO
    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 30);
    const contextText = vectorContexts.map(v => v.pageContent).join("\n\n---\n\n");

    const systemPrompt = `Eres "${chatbot.name}", el asistente del Prof. Salvador Fernández. 
    REGLA: Para notas o faltas, el usuario DEBE dar su correo. 
    Usa este contexto: ${contextText}`;

    // 2. LA LLAVE PARA LOS 1,500 MENSAJES (v1 + gemini-1.5-flash)
    // Cambiamos 'v1beta' por 'v1' para entrar a la oficina estable
    const modelName = "gemini-1.5-flash"; 
    const url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`;

    console.log(`🚀 FORZANDO MODELO ESTABLE: ${modelName} en V1`);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nPregunta: " + message }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 2000 }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("GOOGLE DIJO EN V1:", data);
      throw new Error(data.error?.message || "Error en la oficina V1");
    }

    const reply = data.candidates[0].content.parts[0].text;

    // 3. GUARDAR ANALÍTICAS
    await prisma.interaction.create({
      data: { chatbotId: chatbot.id, query: message, response: reply }
    }).catch(() => {});

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("❌ ERROR FINAL:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}