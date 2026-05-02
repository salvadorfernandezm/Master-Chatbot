export const dynamic = 'force-dynamic';
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { prisma } from "@/lib/prisma";
import { searchVectorStore, loadStoreFromDB } from "@/lib/vectorStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, token } = body;
    const apiKey = process.env.GEMINI_API_KEY;

    // 1. IDENTIFICAR CHATBOT
    const chatbot = await prisma.chatbot.findUnique({
      where: { token, isActive: true },
      include: { knowledgeBase: true }
    });

    if (!chatbot) return NextResponse.json({ error: "Chatbot no encontrado" }, { status: 404 });

    // 2. CARGAR MEMORIA ESPECIALIZADA
    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 30);
    const contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n---\n\n");

    // 3. INSTRUCCIONES SEGÚN EL TIPO DE CHAT
    const isGradesChat = chatbot.knowledgeBase.name.toLowerCase().includes("califica") || 
                         chatbot.name.toLowerCase().includes("nota");

    const systemPrompt = `Eres el asistente académico del Profesor Salvador. 
    ESTA ES TU ÚNICA FUENTE DE VERDAD PARA ESTE CHAT:
    ${contextText || "ATENCIÓN: Tu base de conocimiento está vacía."}

    MODO DE OPERACIÓN:
    ${isGradesChat ? 
      '- ESTÁS EN MODO CALIFICACIONES. Busca al alumno por nombre o correo en el texto. Aplica promedio normalizado (Base 12 / 1.2). Muestra el desglose.' : 
      '- ESTÁS EN MODO TEÓRICO (Xabier Etxeberria o APA). Responde pedagógicamente y no pidas correos ni nombres.'
    }
    - REGLA: Si la información está arriba, úsala. NUNCA digas que no tienes acceso.`;

    const modelName = "gemini-2.0-flash-lite"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nUsuario: " + message }] }],
        safetySettings: [
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" }
        ],
        generationConfig: { temperature: 0.1, maxOutputTokens: 2048 }
      })
    });

    const data = await response.json();
    
    if (data.candidates && data.candidates[0]?.content) {
        return NextResponse.json({ reply: data.candidates[0].content.parts[0].text });
    }

    // SI ALGO FALLA CON GOOGLE, DAMOS UN MENSAJE ÚTIL
    const errorMsg = data.error?.message || "Google no devolvió respuesta. Reintenta en unos segundos.";
    return NextResponse.json({ reply: `⚠️ Error técnico: ${errorMsg}` });

  } catch (error: any) {
    return NextResponse.json({ error: "Sincronizando: " + error.message }, { status: 500 });
  }
}