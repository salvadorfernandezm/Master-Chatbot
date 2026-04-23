export const dynamic = 'force-dynamic';
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { prisma } from "@/lib/prisma";
import { searchVectorStore, loadStoreFromDB } from "@/lib/vectorStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, token } = body;
    const apiKey = process.env.GEMINI_API_KEY;

    const chatbot = await prisma.chatbot.findUnique({
      where: { token, isActive: true },
      include: { knowledgeBase: true }
    });

    if (!chatbot) return NextResponse.json({ error: "Chatbot no encontrado" }, { status: 404 });

    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 30);
    const contextText = vectorContexts.map(v => v.pageContent).join("\n\n---\n\n");

    const systemPrompt = `Eres "${chatbot.name}", asistente del Prof. Salvador. 
    INSTRUCCIÓN: Usa este CONTEXTO (que es un JSON de alumnos): ${contextText}. 
    Si te dan un correo, busca las notas y el conteo de 'absent' (faltas). 
    No menciones que eres una IA, solo da los datos académicos.`;

    // --- EL MODELO QUE SÍ EXISTE EN TU CUENTA ---
    const modelName = "gemini-2.0-flash-lite"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nPregunta: " + message }] }],
        // Bajamos los filtros de seguridad para que el correo no cause bloqueos
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ],
        generationConfig: { temperature: 0.1, maxOutputTokens: 2000 }
      })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error?.message || "Error en la conexión");
    }

    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const reply = data.candidates[0].content.parts[0].text;
        
        await prisma.interaction.create({
          data: { chatbotId: chatbot.id, query: message, response: reply }
        }).catch(() => {});

        return NextResponse.json({ reply });
    } 
    
    return NextResponse.json({ 
        reply: "El sistema de seguridad de Google detectó el correo como dato sensible. Por favor, intenta de nuevo o escribe tu nombre de usuario sin el @." 
    });

  } catch (error: any) {
    return NextResponse.json({ error: "⚠️ " + error.message }, { status: 500 });
  }
}