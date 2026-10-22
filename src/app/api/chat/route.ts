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
    // Ahora recibimos 'history' además del mensaje y el token
    const { message, token, history, studentName, studentEmail, studentGroup } = body;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ reply: "Error: Configuración de IA ausente." });
    }

    const chatbot = await prisma.chatbot.findUnique({
      where: { token, isActive: true },
      include: { knowledgeBase: true }
    });

    if (!chatbot) return NextResponse.json({ reply: "Asistente no disponible." });

    let contextText = "";
    if (chatbot.knowledgeBaseId) {
      try {
        await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
        // Buscamos contexto basado en el mensaje actual
        const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 30);
        contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n");
      } catch (e) { console.error("Error en vectores:", e); }
    }

    // PROMPT DINÁMICO
    const systemPrompt = `
      Eres "${chatbot.name}". 
      Tu identidad: ${chatbot.systemInstructions}
      
      CONTEXTO DE APOYO (PDFs):
      ${contextText || "No hay información adicional en los documentos."}
      
      REGLAS DE CONVERSACIÓN:
      1. Mantén la continuidad del diálogo. Recuerda lo que el usuario te preguntó antes.
      2. Usa el CONTEXTO DE APOYO para dar respuestas técnicas precisas.
      3. Si no sabes algo, no lo inventes; usa tus datos de contacto oficiales.
    `;

    // --- CONSTRUIMOS EL MENSAJE PARA OPENAI INCLUYENDO EL HISTORIAL ---
    const messagesForAI = [
      { role: "system", content: systemPrompt },
      ...history.map((msg: any) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.text
      })),
      { role: "user", content: message }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messagesForAI as any,
      temperature: 0.3,
    });

    const reply = response.choices[0].message.content || "Lo siento, no pude procesar eso.";

    // Guardar analítica
    prisma.interaction.create({
      data: { chatbotId: chatbot.id, query: message.substring(0, 500), response: reply.substring(0, 2000) }
    }).catch(e => console.error("Error analíticas:", e));

await prisma.interaction.create({
  data: { 
    chatbotId: chatbot.id, 
    query: message.substring(0, 1000), 
    response: reply.substring(0, 3000),
    studentName, 
    studentEmail, 
    studentGroup 
  }
});

    return NextResponse.json({ reply });

  } catch (error: any) {
    return NextResponse.json({ reply: "El Ágora está procesando muchas ideas. Reintenta." });
  }
}