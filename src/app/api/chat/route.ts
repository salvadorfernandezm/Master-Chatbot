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
      return NextResponse.json({ reply: "Falta configuración de motor." });
    }

    const chatbot = await prisma.chatbot.findUnique({
      where: { token, isActive: true },
      include: { knowledgeBase: true }
    });

    if (!chatbot) return NextResponse.json({ reply: "Asistente inactivo." });

    let contextText = "";
    if (chatbot.knowledgeBaseId) {
      try {
        await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
        // SUBIMOS A 45 FRAGMENTOS PARA ASEGURAR QUE LLEGUEN LAS OPCIONES TERMINALES
        const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 45);
        contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n");
      } catch (e) { console.error(e); }
    }

    const systemPrompt = `
      Eres "${chatbot.name}". Tu misión es ser un INFORMANTE PROACTIVO Y DETALLISTA.
      
      PERSONALIDAD E INSTRUCCIONES DEL CREADOR:
      ${chatbot.systemInstructions || "Eres un asistente académico experto."}
      
      BASE DE CONOCIMIENTO (Tu única fuente de verdad):
      ${contextText || "No se encontraron datos específicos en los documentos."}
      
      REGLAS DE ORO PARA TUS RESPUESTAS:
      1. Si el usuario pregunta por "maestrías" o "programas", NO te limites a dar los títulos. Investiga en la 'BASE DE CONOCIMIENTO' si existen OPCIONES TERMINALES, ESPECIALIDADES o áreas de acentuación y lístalas siempre.
      2. Si encuentras un plan de estudios o requisitos, menciónalos de forma estructurada. Al usuario le encanta el detalle.
      3. Sé exhaustivo: es mejor dar mucha información verídica que ser demasiado breve y parecer desinformado.
      4. Si la información NO está en la base de datos, NO la inventes, pero usa tus datos de contacto para ofrecer ayuda personalizada.
      5. Responde siempre de forma natural, humana y profesional. Evita frases como "según el texto".
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: 0.3, 
    });

    const reply = response.choices[0].message.content || "Lo siento, no pude procesar la respuesta.";

    prisma.interaction.create({
      data: { chatbotId: chatbot.id, query: message.substring(0, 500), response: reply.substring(0, 2000) }
    }).catch(e => console.error(e));

    return NextResponse.json({ reply });

  } catch (error: any) {
    return NextResponse.json({ reply: "Conexión interrumpida con el Ágora." });
  }
}