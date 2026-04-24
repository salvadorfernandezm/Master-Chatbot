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

    // --- OPTIMIZACIÓN DE VELOCIDAD ---
    // Cargamos los vectores pero de forma mucho más ligera
    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 10);
    const contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n");

    const systemPrompt = `Eres un asistente académico. Contexto: ${contextText}. Responde directo y breve.`;

    // USAMOS EL MODELO QUE TU TERMINAL DIJO QUE TIENES (v1beta)
    // El 2.0-flash es el que Google quiere que uses ahora
    const modelName = "gemini-2.0-flash"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nUsuario: " + message }] }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
        // Si el 2.0 falla, saltamos al 1.5 automáticamente para no dar error
        const altUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const altRes = await fetch(altUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: message }] }] })
        });
        const altData = await altRes.json();
        return NextResponse.json({ reply: altData.candidates[0].content.parts[0].text });
    }

    const reply = data.candidates[0].content.parts[0].text;
    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("❌ FALLO REAL:", error.message);
    // Cambiamos el mensaje para que veas el error real si algo falla
    return NextResponse.json({ error: "Google está pensando... reintenta una vez más: " + error.message }, { status: 500 });
  }
}