export const dynamic = 'force-dynamic';
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { prisma } from "@/lib/prisma";
import { searchVectorStore, loadStoreFromDB } from "@/lib/vectorStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, token } = body;
    const apiKey = process.env.GEMINI_API_KEY;

    console.log("-----------------------------------------");
    console.log("🚀 EJECUTANDO VERSIÓN DE PRODUCCIÓN 1.5");
    console.log("-----------------------------------------");

    const chatbot = await prisma.chatbot.findUnique({ where: { token, isActive: true } });
    if (!chatbot) return NextResponse.json({ error: "No hay chatbot" }, { status: 404 });

    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 15);
    
    // AQUÍ ESTÁ EL ARREGLO: Añadimos (v: any) para que no haya quejas
    const contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n---\n\n");

    const systemPrompt = `Eres un asistente académico. Usa este contexto: ${contextText}. Responde directo y sin inventar.`;

    // USAMOS EL MODELO ESTÁNDAR POR LA PUERTA DE PRODUCCIÓN (v1)
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nUsuario: " + message }] }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
        console.error("❌ ERROR GOOGLE:", JSON.stringify(data));
        throw new Error(data.error?.message || "Error de cuota");
    }

    const reply = data.candidates[0].content.parts[0].text;

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("❌ FALLO:", error.message);
    return NextResponse.json({ error: "El sistema está procesando datos. Por favor, reintenta en 10 segundos." }, { status: 500 });
  }
}