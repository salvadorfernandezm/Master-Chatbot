export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchVectorStore, loadStoreFromDB } from "@/lib/vectorStore";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, token } = body;

    const chatbot = await prisma.chatbot.findUnique({
      where: { token, isActive: true },
      include: { knowledgeBase: true }
    });

    if (!chatbot) return NextResponse.json({ reply: "Asistente no disponible." });

    let contextText = "";
    if (chatbot.knowledgeBaseId) {
      try {
        await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
        const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 40);
        contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n");
      } catch (e) { console.error("Error en vectores:", e); }
    }

    const systemPrompt = `
      Eres "${chatbot.name}". Tu misión es informar con amabilidad y precisión.
      CONOCIMIENTO BASE: ${chatbot.systemInstructions}
      DETALLES EXTRAÍDOS: ${contextText || "No hay detalles adicionales."}
      REGLAS:
      1. Usa el CONOCIMIENTO BASE para tu identidad.
      2. Usa los DETALLES EXTRAÍDOS para dar respuestas técnicas.
      3. No inventes programas. Si no sabes, invita a contactar a la oficina.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: 0.2,
    });

    const reply = response.choices[0].message.content || "Lo siento, no pude procesar la respuesta.";

    // --- EL TAQUÍGRAFO AHORA SÍ ESPERA (AWAIT) ---
    try {
      await prisma.interaction.create({
        data: { 
          chatbotId: chatbot.id, 
          query: message.substring(0, 500), 
          response: reply.substring(0, 2000) 
        }
      });
    } catch (e) { 
      console.error("Error guardando analíticas:", e); 
    }

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("Error general en chat:", error);
    return NextResponse.json({ reply: "Conexión interrumpida con el Ágora." });
  }
}