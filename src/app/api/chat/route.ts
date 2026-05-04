export const dynamic = 'force-dynamic';
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { prisma } from "@/lib/prisma";
import { searchVectorStore, loadStoreFromDB } from "@/lib/vectorStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, token } = body;
    
    const apiKeyGemini = process.env.GEMINI_API_KEY;
    const apiKeyOpenAI = process.env.OPENAI_API_KEY;

    // 1. IDENTIFICAR CHATBOT
    const chatbot = await prisma.chatbot.findUnique({ where: { token, isActive: true } });
    if (!chatbot) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 15);
    const contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n");

    const systemPrompt = `Eres el asistente académico del Prof. Salvador. Usa este contexto: ${contextText}. Si es sobre notas, busca al alumno y dale el promedio literal del archivo.`;

    let finalReply = "";

    // --- MOTOR 1: GEMINI ---
    try {
      console.log("📡 Intentando con Gemini...");
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKeyGemini}`;
      const res = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt + "\n\n" + message }] }] })
      });
      const data = await res.json();
      if (res.ok && data.candidates?.[0]?.content) {
        finalReply = data.candidates[0].content.parts[0].text;
      }
    } catch (e) { console.log("Gemini falló, saltando a OpenAI..."); }

    // --- MOTOR 2: OPENAI (RESPALDO) ---
    if (!finalReply && apiKeyOpenAI) {
      console.log("⚠️ Activando motor de respaldo OpenAI...");
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKeyOpenAI}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: message }]
        })
      });
      const data = await res.json();
      finalReply = data.choices?.[0]?.message?.content || "";
    }

    if (!finalReply) throw new Error("Ningún motor respondió.");

    // --- AQUÍ ESTÁ EL CAMBIO: GUARDAMOS SIEMPRE ---
    try {
      await prisma.interaction.create({
        data: {
          chatbotId: chatbot.id,
          query: message.substring(0, 500),
          response: finalReply.substring(0, 2048)
        }
      });
      console.log("📝 Analítica grabada con éxito.");
    } catch (dbErr) {
      console.error("❌ Fallo al anotar en el diario:", dbErr);
    }

    return NextResponse.json({ reply: finalReply });

  } catch (error: any) {
    console.error("❌ FALLO:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}