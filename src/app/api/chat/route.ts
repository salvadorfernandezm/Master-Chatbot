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
    console.log("🚀 EJECUTANDO: VERSIÓN DE PRODUCCIÓN FINAL");
    console.log("-----------------------------------------");

    const chatbot = await prisma.chatbot.findUnique({ where: { token, isActive: true } });
    if (!chatbot) return NextResponse.json({ error: "Chatbot no encontrado" }, { status: 404 });

    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 10);
    const contextText = vectorContexts.map(v => v.pageContent).join("\n\n---\n\n");

    const systemPrompt = `Eres un asistente académico. Usa este contexto: ${contextText}. Responde directo.`;

    // --- ESTRATEGIA DE MODELOS (INTENTO DOBLE) ---
    const models = ["gemini-1.5-flash", "gemini-2.0-flash"];
    let reply = "";
    let success = false;

    for (const modelName of models) {
      if (success) break;
      console.log(`📡 Probando modelo: ${modelName}`);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt + "\n\nPregunta: " + message }] }] })
      });

      const data = await response.json();
      if (response.ok) {
        reply = data.candidates[0].content.parts[0].text;
        success = true;
      }
    }

    if (!success) throw new Error("Google está procesando. Reintenta en 10 segundos.");

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("❌ FALLO:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}