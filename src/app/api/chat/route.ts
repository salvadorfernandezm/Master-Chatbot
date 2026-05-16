export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchVectorStore } from "@/lib/vectorStore";

export async function POST(req: Request) {
  try {
    const { message, token } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    const chatbot = await prisma.chatbot.findUnique({ where: { token, isActive: true } });
    if (!chatbot) return NextResponse.json({ reply: "Chatbot no encontrado." });

    const results = await searchVectorStore(message, chatbot.knowledgeBaseId, 10);
    const contextText = results.map((v: any) => v.pageContent).join("\n\n");

    const systemPrompt = `Eres un asistente académico. Contexto: ${contextText}. Responde directo.`;

    // USAMOS EL ALIAS UNIVERSAL QUE GOOGLE SIEMPRE RESPONDE
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt + "\n\nUsuario: " + message }] }] })
    });

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Google está saturado, reintenta en 5 segundos.";

    // Guardado de analítica en segundo plano
    prisma.interaction.create({ data: { chatbotId: chatbot.id, query: message, response: reply } }).catch(()=>{});

    return NextResponse.json({ reply });

  } catch (error: any) {
    return NextResponse.json({ reply: "Reintentando... Google está procesando datos." });
  }
}