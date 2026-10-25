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
    const { message, token, history, studentName, studentEmail, studentGroup } = body;

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
      IDENTIDAD: ${chatbot.systemInstructions}
      CONTEXTO: ${contextText || "No hay información adicional."}
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...history.map((h: any) => ({
          role: h.role === "user" ? "user" : "assistant",
          content: h.text
        })),
        { role: "user", content: message }
      ],
      temperature: 0.2,
    });

    const reply = response.choices[0].message.content || "Lo siento, no pude procesar eso.";

    // --- EL TAQUÍGRAFO AHORA SÍ ESPERA (AWAIT) Y ES MÁS ESTRICTO ---
    await prisma.interaction.create({
      data: { 
        chatbotId: chatbot.id, 
        query: message.substring(0, 1000), 
        response: reply.substring(0, 3000),
        studentName: studentName || "Anónimo",
        studentEmail: studentEmail || "N/A",
        studentGroup: studentGroup || "N/A"
      }
    });

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("Error en chat:", error);
    return NextResponse.json({ reply: "El Ágora está saturada. Intenta en un momento." });
  }
}
