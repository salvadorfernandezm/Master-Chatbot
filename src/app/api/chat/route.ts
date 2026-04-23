export const dynamic = 'force-dynamic';
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { prisma } from "@/lib/prisma";
import { searchVectorStore, loadStoreFromDB } from "@/lib/vectorStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, token } = body;
    const apiKey = process.env.GEMINI_API_KEY;

    // --- ESTO ES PARA EL DETECTIVE SALVADOR ---
    const keyCheck = apiKey ? apiKey.substring(0, 8) : "NO HAY LLAVE";
    console.log(`🔎 Vercel está usando la llave que empieza con: ${keyCheck}`);

    if (!apiKey) return NextResponse.json({ error: "Falta API Key" }, { status: 500 });

    const chatbot = await prisma.chatbot.findUnique({ where: { token, isActive: true } });
    if (!chatbot) return NextResponse.json({ error: "Chatbot no encontrado" }, { status: 404 });

    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 15);
    const contextText = vectorContexts.map(v => v.pageContent).join("\n\n---\n\n");

    // MODELO ESTÁNDAR (El que tiene 1,500 mensajes)
    const modelName = "gemini-1.5-flash"; 
    const url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `CONTEXTO: ${contextText}\n\nPREGUNTA: ${message}` }] }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
        console.error("❌ GOOGLE DIJO:", data.error?.message);
        throw new Error(data.error?.message || "Saturación");
    }

    const reply = data.candidates[0].content.parts[0].text;
    return NextResponse.json({ reply });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}