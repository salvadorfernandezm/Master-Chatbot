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
        // Mantenemos la lupa alta para pescar todo
        const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 40);
        contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n");
      } catch (e) { console.error(e); }
    }

    // EL PROMPT "CON VALOR": Le quitamos la timidez
    const systemPrompt = `
      Eres "${chatbot.name}". Tu misión es informar con PRECISIÓN usando los documentos que tienes.
      
      PERSONALIDAD:
      ${chatbot.systemInstructions || "Eres un asistente académico experto."}
      
      INFORMACIÓN EXTRAÍDA DE TUS ARCHIVOS (Úsala como tu única fuente de verdad):
      ${contextText || "No se encontraron datos específicos en los documentos."}
      
      INSTRUCCIONES DE RESPUESTA:
      1. Tu prioridad absoluta es responder con la 'Información extraída'. 
      2. Si en los archivos ves nombres de maestrías, especialidades o procesos, lístalos detalladamente. 
      3. No seas vago. Si los datos están ahí, entrégalos al usuario.
      4. Solo si la pregunta es totalmente ajena a tus archivos, usa tus datos de contacto oficiales para invitar al usuario a la oficina.
      5. Responde siempre en español, de forma humana y profesional.
      6. No menciones frases como "según el contexto proporcionado" o "mis archivos dicen". Responde directamente.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: 0.4, // Subimos un pelín la temperatura para que sea más elocuente
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