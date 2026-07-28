export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchVectorStore, loadStoreFromDB } from "@/lib/vectorStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, token } = body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) return NextResponse.json({ error: "Falta API Key" }, { status: 500 });

    // Buscamos el chatbot y su base de conocimiento asociada
    const chatbot = await prisma.chatbot.findUnique({
      where: { token, isActive: true },
      include: { knowledgeBase: true }
    });

    if (!chatbot) return NextResponse.json({ error: "Chatbot no encontrado o inactivo" }, { status: 404 });

    let contextText = "";
    
    // 1. CARGAR CONTEXTO SOLO SI TIENE UNA BASE ASIGNADA
    if (chatbot.knowledgeBaseId) {
      console.log(`Buscando en la base: ${chatbot.knowledgeBaseId}`);
      await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
      const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 25);
      contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n");
    }

    // 2. CONSTRUIR EL PROMPT (Dándole prioridad a tus instrucciones)
    const systemPrompt = `
      Eres "${chatbot.name}". 
      Instrucciones críticas de tu identidad: ${chatbot.systemInstructions || "Eres un asistente amable."}
      
      CONTEXTO DE TU BASE DE DATOS:
      ${contextText || "No hay información específica en la base de datos para esta pregunta."}
      
      REGLAS DE RESPUESTA:
      1. Usa el CONTEXTO proporcionado para responder de forma precisa.
      2. Si la información no está en el contexto, responde basado en tus instrucciones de identidad.
      3. Mantén siempre un tono profesional y servicial.
      4. Si el usuario pregunta algo que no sabes, sugiere contactar a la División de Estudios de Posgrado.
    `;

    // 3. LLAMADA A GOOGLE (Usando el modelo flash que es más rápido)
    const modelName = "gemini-1.5-flash"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ 
          parts: [{ text: systemPrompt + "\n\nPregunta del usuario: " + message }] 
        }],
        generationConfig: { 
          temperature: 0.3, // Un poco más bajo para que sea más preciso con los datos
          maxOutputTokens: 2048 
        }
      })
    });

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0]) {
        return NextResponse.json({ reply: "Sócrates está meditando. Por favor, intenta de nuevo." });
    }

    const reply = data.candidates[0].content.parts[0].text;

    // 4. GUARDAR ANALÍTICAS (Sin bloquear la respuesta)
    prisma.interaction.create({
      data: { chatbotId: chatbot.id, query: message.substring(0, 500), response: reply.substring(0, 2000) }
    }).catch(e => console.error("Error analíticas:", e));

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("Error en el chat:", error);
    return NextResponse.json({ error: "El Ágora está saturada. Reintentando..." }, { status: 500 });
  }
}