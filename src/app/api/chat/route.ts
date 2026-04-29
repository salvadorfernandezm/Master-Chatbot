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
    });

    if (!chatbot) return NextResponse.json({ error: "Chatbot no encontrado" }, { status: 404 });

    // 1. CARGA LIGERA (Solo 10 fragmentos para evitar cortes de tiempo)
    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 10);
    const contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n");

    const systemPrompt = `Eres un asistente académico. Contexto: ${contextText}. Responde directo.`;

    // 2. EL MODELO "LITE" (Este es el que tiene los 1,500 mensajes en tu cuenta)
    const modelName = "gemini-2.0-flash-lite"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    console.log(`📡 Intentando conectar con el modelo LITE: ${modelName}`);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nPregunta: " + message }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1500 }
      })
    });

    const data = await response.json();

    if (!response.ok) {
        console.error("❌ ERROR REAL DE GOOGLE:", data.error?.message);
        throw new Error(data.error?.message || "Error de cuota");
    }

    const reply = data.candidates[0].content.parts[0].text;

    // 3. GUARDAR ANALÍTICAS
    await prisma.interaction.create({
      data: { 
        chatbotId: chatbot.id, 
        query: message.substring(0, 500), 
        response: reply.substring(0, 2000) 
      }
    }).catch(() => {});

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("❌ FALLO CRÍTICO:", error.message);
    // Aquí te devolveré el error real para que lo veamos en pantalla si falla
    return NextResponse.json({ error: "Nota: " + error.message }, { status: 500 });
  }
}