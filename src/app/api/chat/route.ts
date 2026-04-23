export const dynamic = 'force-dynamic';
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { prisma } from "@/lib/prisma";
import { searchVectorStore, loadStoreFromDB } from "@/lib/vectorStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, token } = body;
    const apiKey = process.env.GEMINI_API_KEY;

    // --- LOG DE VERSIÓN PARA EL MAESTRO SALVADOR ---
    console.log("-----------------------------------------");
    console.log("🚀 EJECUTANDO RAG CHAT VERSIÓN 10.0");
    console.log(`🔑 LLAVE USADA: ${apiKey?.substring(0, 10)}...`);
    console.log("-----------------------------------------");

    if (!apiKey) return NextResponse.json({ error: "Falta API Key" }, { status: 500 });

    const chatbot = await prisma.chatbot.findUnique({
      where: { token, isActive: true },
      include: { knowledgeBase: true }
    });

    if (!chatbot) return NextResponse.json({ error: "Chatbot no encontrado" }, { status: 404 });

    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 15);
    const contextText = vectorContexts.map(v => v.pageContent).join("\n\n---\n\n");

    // USAMOS EL MODELO LITE (El que debe tener la cuota libre)
    const modelName = "gemini-2.0-flash-lite"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `CONTEXTO:\n${contextText}\n\nPREGUNTA: ${message}` }] }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
        // Logeamos el error exacto de Google para verlo en Vercel
        console.error("❌ GOOGLE DIJO:", JSON.stringify(data));
        throw new Error(data.error?.message || "Saturación");
    }

    const reply = data.candidates[0].content.parts[0].text;
    
    // Guardar para analíticas
    await prisma.interaction.create({
      data: { chatbotId: chatbot.id, query: message, response: reply }
    }).catch(() => {});

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("❌ FALLO EN LA RUTA:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Intento de conexión final - 23 de abril