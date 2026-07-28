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

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ reply: "Error: Falta la configuración del motor de IA." });
    }

    // Buscamos el chatbot y su base de conocimiento
    const chatbot = await prisma.chatbot.findUnique({
      where: { token, isActive: true },
      include: { knowledgeBase: true }
    });

    if (!chatbot) {
      return NextResponse.json({ reply: "Este asistente no se encuentra disponible por ahora." });
    }

    let contextText = "";
    
    // 1. CARGAR CONTEXTO DE LA BASE DE DATOS (Si tiene una asignada)
    if (chatbot.knowledgeBaseId) {
      try {
        await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
        const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 25);
        contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n");
      } catch (e) {
        console.error("Error cargando conocimiento:", e);
      }
    }

    // 2. CONSTRUIR LA IDENTIDAD DINÁMICA
    // Aquí el bot toma la personalidad que TÚ le escribiste en el panel
    const systemPrompt = `
      Eres "${chatbot.name}".
      
      INSTRUCCIONES DE TU CREADOR (Sigue esto estrictamente):
      ${chatbot.systemInstructions || "Eres un asistente servicial y amable."}
      
      CONTEXTO DE INFORMACIÓN (Usa esto para responder):
      ${contextText || "No hay documentos específicos para esta pregunta en tu base de datos."}
      
      REGLAS:
      1. Responde siempre basándote en las 'Instrucciones de tu creador' y el 'Contexto de información'.
      2. Si la respuesta no está en el contexto, usa tu conocimiento general pero mantén tu personalidad.
      3. No menciones que eres una IA o un modelo de lenguaje, actúa siempre como el asistente asignado.
    `;

    // 3. LLAMADA A OPENAI (Mucho más estable que Google)
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: 0.3, // Bajo para que no invente cosas y sea fiel a los PDFs
    });

    const reply = response.choices[0].message.content || "Lo siento, no pude procesar la respuesta.";

    // 4. GUARDAR ANALÍTICAS
    prisma.interaction.create({
      data: { 
        chatbotId: chatbot.id, 
        query: message.substring(0, 500), 
        response: reply.substring(0, 2000) 
      }
    }).catch(e => console.error("Error analíticas:", e));

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("Error en el motor del chat:", error);
    return NextResponse.json({ reply: "El sistema está procesando mucha información. Por favor, intenta de nuevo." });
  }
}