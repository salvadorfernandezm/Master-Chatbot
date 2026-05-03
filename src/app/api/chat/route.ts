export const dynamic = 'force-dynamic';
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { prisma } from "@/lib/prisma";
import { searchVectorStore, loadStoreFromDB } from "@/lib/vectorStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, token } = body;

    // Detectar qué llaves hay
    const key1 = process.env.GEMINI_API_KEY;
    const key2 = process.env.GEMINI_API_KEY_2;
    
    if (!key1 && !key2) return NextResponse.json({ reply: "❌ No hay ninguna API KEY configurada en Vercel." });

    const chatbot = await prisma.chatbot.findUnique({ where: { token, isActive: true } });
    if (!chatbot) return NextResponse.json({ reply: "❌ Chatbot no encontrado." });

    // CARGAR CONTEXTO
    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 10);
    const contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n");

    const systemPrompt = `Eres un asistente. Contexto: ${contextText}`;

    // --- EL MOMENTO DE LA VERDAD: UN SOLO DISPARO DIRECTO ---
    // Usaremos el modelo más seguro y estable (1.5 Flash)
    // Usando la cuenta nueva (key1)
    const activeKey = key1 || key2 || "";
    const modelName = "gemini-2.0-flash-lite"; 
const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    console.log("-----------------------------------------!!!!!!!");
console.log("🚀 EJECUTANDO VERSION ULTRA FINAL DE PRUEBA");
console.log("-----------------------------------------!!!!!!!");

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\n" + message }] }]
      })
    });

    const data = await response.json();

    if (response.ok) {
      const reply = data.candidates[0].content.parts[0].text;
      return NextResponse.json({ reply });
    } else {
      // SI FALLA, LE MOSTRAMOS EL MENSAJE REAL DE GOOGLE A SALVADOR
      return NextResponse.json({ 
        reply: `🚫 ERROR DE GOOGLE:\nCódigo: ${data.error?.code}\nMensaje: ${data.error?.message}\nLlave usada: ${activeKey.substring(0, 6)}...`
      });
    }

  } catch (error: any) {
    return NextResponse.json({ reply: `❌ FALLO TÉCNICO: ${error.message}` });
  }
}