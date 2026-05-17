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

    // 1. IDENTIFICAR AL CHATBOT
    const chatbot = await prisma.chatbot.findUnique({
      where: { token, isActive: true },
      include: { knowledgeBase: true }
    });
    if (!chatbot) return NextResponse.json({ reply: "Chatbot no encontrado." });

    // 2. CARGAR CONTEXTO (RAG)
    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 15);
    const contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n");

    const systemPrompt = `Eres el asistente oficial del Prof. Salvador. Usa este contexto: ${contextText}.
    REGLA: Para notas, busca al alumno. Para APA o ética, explica con detalle.`;

    let finalReply = "";

    // --- INTENTO 1: GEMINI ---
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKeyGemini}`;
      const res = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt + "\n\nUsuario: " + message }] }] })
      });
      const data = await res.json();
      if (res.ok && data.candidates?.[0]?.content) {
        finalReply = data.candidates[0].content.parts[0].text;
      }
    } catch (e) { console.log("Google en espera, saltando a respaldo..."); }

    // --- INTENTO 2: OPENAI (RESPALDO) ---
    if (!finalReply && apiKeyOpenAI) {
      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKeyOpenAI}` },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: message }]
          })
        });
        const data = await response.json();
        finalReply = data.choices?.[0]?.message?.content || "";
      } catch (e) { console.log("Fallo en respaldo."); }
    }

    if (!finalReply) finalReply = "El sistema está recibiendo muchas dudas. Por favor, reintenta en 15 segundos.";

    // --- EL TOQUE DE GRACIA: GUARDADO ASEGURADO ---
    // Ponemos esto justo antes del return final, fuera de cualquier "if"
    await prisma.interaction.create({
      data: {
        chatbotId: chatbot.id,
        query: message.substring(0, 1000),
        response: finalReply.substring(0, 5000) // Para que no corte el APA
      }
    }).catch(err => console.error("Error analíticas:", err));

    return NextResponse.json({ reply: finalReply });

  } catch (error: any) {
    console.error("❌ FALLO:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}