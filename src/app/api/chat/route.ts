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
      return NextResponse.json({ reply: "Configuración incompleta." });
    }

    const chatbot = await prisma.chatbot.findUnique({
      where: { token, isActive: true },
      include: { knowledgeBase: true }
    });

    if (!chatbot) return NextResponse.json({ reply: "Asistente fuera de línea." });

    let contextText = "";
    if (chatbot.knowledgeBaseId) {
      try {
        await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
        const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 35);
        contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n");
      } catch (e) { console.error(e); }
    }

    // EL PROMPT REFINADO (Para evitar que transcriba las instrucciones)
    const systemPrompt = `
      Eres "${chatbot.name}". Actúa de forma profesional, amable y servicial.
      
      TU IDENTIDAD Y MISIÓN:
      ${chatbot.systemInstructions || "Eres un asistente académico."}
      
      INFORMACIÓN DE APOYO (Base de datos):
      ${contextText || "No hay datos específicos en los documentos para esta consulta."}
      
      NORMAS DE CONDUCTA:
      1. Usa la 'Información de apoyo' para responder con precisión.
      2. NUNCA transcribas frases como "IMPORTANTE: Tus datos de contacto son...". Simplemente usa esa información para responder de forma natural (ej: "Puede contactarnos al...").
      3. Si el usuario pregunta por maestrías, revisa la 'Información de apoyo'. SOLO menciona las que aparezcan ahí. Si no hay una lista clara, responde con amabilidad que la oferta se actualiza constantemente y sugiere contactar a la oficina.
      4. Mantén un tono humano. No menciones que eres una IA.
      5. Si no encuentras la respuesta en los documentos, apóyate en tus datos de contacto oficiales para invitar al alumno a la oficina.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: 0.3, // Subimos un pelín para que no sea un robot de madera
    });

    const reply = response.choices[0].message.content || "Lo siento, no pude procesar la respuesta.";

    prisma.interaction.create({
      data: { chatbotId: chatbot.id, query: message.substring(0, 500), response: reply.substring(0, 2000) }
    }).catch(e => console.error(e));

    return NextResponse.json({ reply });

  } catch (error: any) {
    return NextResponse.json({ reply: "El Ágora está llena. Intenta en un momento." });
  }
}