export const dynamic = 'force-dynamic';
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { prisma } from "@/lib/prisma";
import { searchVectorStore, loadStoreFromDB } from "@/lib/vectorStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, token } = body;
    
    // TRUCO DE LAS DOS LLAVES: Si una no está, intenta la otra
    const apiKeys = [process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_2].filter(Boolean);
    
    if (apiKeys.length === 0) return NextResponse.json({ error: "Faltan llaves en Vercel" }, { status: 500 });

    const chatbot = await prisma.chatbot.findUnique({
      where: { token, isActive: true },
    });

    if (!chatbot) return NextResponse.json({ error: "Chatbot apagado por examen o inactivo" }, { status: 404 });

    // CARGAR CONTEXTO
    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 20);
    const contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n---\n\n");

    const systemPrompt = `ATENCIÓN ASISTENTE: Eres el clon del Prof. Salvador. 
    A CONTINUACIÓN TIENES LA INFORMACIÓN REAL QUE DEBES USAR:
    ${contextText || "AVISO: No se encontraron documentos."}
    
    INSTRUCCIONES:
    1. NO digas que no tienes acceso. Si hay texto arriba, ESA ES TU BASE DE DATOS.
    2. Si preguntan por notas, busca al alumno por correo o nombre y di los valores. 
    3. Si es teoría o APA, sé pedagógico.`;

    // INTENTO DOBLE CON LLAVES
    let lastError = "";
    for (const key of apiKeys) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${key}`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt + "\n\nUsuario: " + message }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 2000 }
        })
      });

      const data = await response.json();
      if (response.ok && data.candidates?.[0]?.content) {
          const reply = data.candidates[0].content.parts[0].text;
          // Guardar analíticas
          await prisma.interaction.create({
            data: { chatbotId: chatbot.id, query: message, response: reply }
          }).catch(() => {});
          return NextResponse.json({ reply });
      }
      lastError = data.error?.message || "Fallo técnico";
    }

    throw new Error(lastError);

  } catch (error: any) {
    console.error("❌ FALLO:", error.message);
    return NextResponse.json({ error: "Saturación. Por favor, reintenta en 15 segundos." }, { status: 500 });
  }
}