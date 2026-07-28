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
      return NextResponse.json({ reply: "Error de configuración de IA." });
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
        // Mantenemos una lupa amplia
        const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 45);
        contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n");
      } catch (e) { console.error(e); }
    }

    // EL PROMPT "Fiel a la Letra": Blindaje total contra inventos
    const systemPrompt = `
      Eres "${chatbot.name}". Tu única fuente de verdad es la 'INFORMACIÓN DE LOS ARCHIVOS' que se te proporciona abajo.
      
      REGLAS ESTRICTAS DE RESPUESTA:
      1. PROHIBICIÓN DE INVENCIÓN: No menciones ninguna maestría, especialidad o programa que no esté escrito EXPLÍCITAMENTE en la sección 'INFORMACIÓN DE LOS ARCHIVOS'.
      2. TRAMPA DE NOMBRE: Aunque la Facultad se llame "Terapia de la Comunicación Humana", NO asumas que existe una maestría con ese nombre a menos que aparezca en los documentos.
      3. SILENCIO HONESTO: Si la información no está en los archivos, di simplemente: "Lamentablemente, esa información específica no se encuentra en mis registros actuales".
      4. PRIORIDAD DE IDENTIDAD: Usa siempre estos datos de contacto: ${chatbot.systemInstructions}.
      5. No menciones que eres una IA ni hables de "contextos". Responde como el asistente de la oficina.
      
      INFORMACIÓN DE LOS ARCHIVOS (Tu única base de datos):
      ${contextText || "No hay documentos cargados."}
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: 0, // CERO ABSOLUTO: Cero creatividad, 100% precisión.
      presence_penalty: 0,
      frequency_penalty: 0,
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
    return NextResponse.json({ reply: "Conexión interrumpida." });
  }
}