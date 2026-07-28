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
      return NextResponse.json({ reply: "Error: Falta la configuración de IA." });
    }

    const chatbot = await prisma.chatbot.findUnique({
      where: { token, isActive: true },
      include: { knowledgeBase: true }
    });

    if (!chatbot) {
      return NextResponse.json({ reply: "Asistente no disponible." });
    }

    let contextText = "";
    
    if (chatbot.knowledgeBaseId) {
      try {
        await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
        // AUMENTAMOS LA LUPA A 40 FRAGMENTOS PARA NO PERDER DETALLES
        const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 40);
        contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n");
      } catch (e) {
        console.error("Error cargando conocimiento:", e);
      }
    }

    // PROMPT REFORZADO: LA CAMISA DE FUERZA
    const systemPrompt = `
      Eres "${chatbot.name}".
      
      IDENTIDAD Y CONTACTO (Úsalo siempre):
      ${chatbot.systemInstructions || "Eres un asistente servicial."}
      
      CONTEXTO DE INFORMACIÓN (Toda tu verdad está aquí):
      ${contextText || "No hay información disponible en los documentos."}
      
      REGLAS CRÍTICAS DE RESPUESTA:
      1. SOLO menciona maestrías o programas que aparezcan EXPLÍCITAMENTE en el 'CONTEXTO DE INFORMACIÓN'. 
      2. No inventes programas basados en el nombre de la Facultad. 
      3. Si el usuario pregunta por maestrías y no encuentras una lista clara en el contexto, responde: "Lamentablemente, no tengo la lista de maestrías vigentes en mis archivos actuales, por favor contacta a la División".
      4. Está terminantemente PROHIBIDO alucinar o suponer programas académicos.
      5. Si la información es ambigua, prioriza los datos de contacto que tienes en tus instrucciones.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: 0.1, // BAJAMOS LA TEMPERATURA AL MÍNIMO PARA QUE NO SEA CREATIVO
    });

    const reply = response.choices[0].message.content || "No pude procesar la respuesta.";

    prisma.interaction.create({
      data: { 
        chatbotId: chatbot.id, 
        query: message.substring(0, 500), 
        response: reply.substring(0, 2000) 
      }
    }).catch(e => console.error("Error analíticas:", e));

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("Error en el chat:", error);
    return NextResponse.json({ reply: "Sistema en mantenimiento técnico. Reintenta pronto." });
  }
}