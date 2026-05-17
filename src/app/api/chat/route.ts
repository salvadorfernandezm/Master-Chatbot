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

    // 2. CARGAR CONTEXTO
    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const results = await searchVectorStore(message, chatbot.knowledgeBaseId, 15);
    const contextText = results.map((v: any) => v.pageContent).join("\n\n");

    const systemPrompt = `Eres el asistente académico del Prof. Salvador. Usa este CONTEXTO para responder de forma precisa: ${contextText}.
    REGLA: Si preguntan por calificaciones, busca al alumno. Para APA, sé detallado.`;

    let finalReply = "";

    // --- MOTOR 1: GEMINI (GRATIS) ---
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKeyGemini}`;
      const resG = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt + "\n\nUsuario: " + message }] }] })
      });
      const dataG = await resG.json();
      if (resG.ok && dataG.candidates?.[0]?.content) {
        finalReply = dataG.candidates[0].content.parts[0].text;
      }
    } catch (e) { console.log("Google ocupado, saltando a OpenAI..."); }

    // --- MOTOR 2: OPENAI (RESPALDO DE PAGO) ---
    if (!finalReply && apiKeyOpenAI) {
      try {
        const resO = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKeyOpenAI}` },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: message }]
          })
        });
        const dataO = await resO.json();
        finalReply = dataO.choices?.[0]?.message?.content || "";
      } catch (e) { console.log("Fallo en motor de respaldo."); }
    }

    if (!finalReply) finalReply = "⚠️ El sistema de inteligencia artificial está muy saturado. Por favor, reintenta tu pregunta en 20 segundos.";

    // --- EL TAQUÍGRAFO (REGISTRO FINAL) ---
    await prisma.interaction.create({
      data: {
        chatbotId: chatbot.id,
        query: message.substring(0, 1000),
        response: finalReply.substring(0, 5000)
      }
    }).catch(err => console.error("Error analíticas:", err));

    return NextResponse.json({ reply: finalReply });

  } catch (error: any) {
    console.error("❌ FALLO:", error.message);
    return NextResponse.json({ reply: "Sincronizando sabiduría... intenta de nuevo." });
  }
}