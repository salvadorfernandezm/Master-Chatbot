export const dynamic = 'force-dynamic';
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { prisma } from "@/lib/prisma";
import { searchVectorStore, loadStoreFromDB } from "@/lib/vectorStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, token } = body;
    const apiKey = process.env.GEMINI_API_KEY;

    // LOG PARA EL MAESTRO SALVADOR
    console.log(`🚀 LLAMADA RECIBIDA. Usando llave: ${apiKey?.substring(0, 10)}...`);

    if (!apiKey) return NextResponse.json({ error: "Falta API Key" }, { status: 500 });

    const chatbot = await prisma.chatbot.findUnique({
      where: { token, isActive: true },
      include: { knowledgeBase: true }
    });

    if (!chatbot) return NextResponse.json({ error: "Chatbot no encontrado" }, { status: 404 });

    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 20);
    const contextText = vectorContexts.map(v => v.pageContent).join("\n\n---\n\n");

    // USAMOS EL MODELO QUE TU CUENTA SÍ TIENE (2.0 LITE)
    const modelName = "gemini-2.0-flash-lite"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `CONTEXTO:\n${contextText}\n\nPREGUNTA: ${message}` }] }],
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
        console.error("❌ ERROR GOOGLE:", data.error?.message);
        throw new Error(data.error?.message || "Saturación");
    }

    const reply = data.candidates[0].content.parts[0].text;
    
    // Guardar analíticas
    await prisma.interaction.create({
      data: { chatbotId: chatbot.id, query: message, response: reply }
    }).catch(() => {});

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("❌ FALLO:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}