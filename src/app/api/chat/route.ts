export const dynamic = 'force-dynamic';
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { prisma } from "@/lib/prisma";
import { searchVectorStore, loadStoreFromDB } from "@/lib/vectorStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, token } = body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) return NextResponse.json({ error: "Falta API Key" }, { status: 500 });

    const chatbot = await prisma.chatbot.findUnique({
      where: { token, isActive: true },
      include: { knowledgeBase: true }
    });

    if (!chatbot) return NextResponse.json({ error: "Chatbot no encontrado" }, { status: 404 });

    // 1. CARGAR MEMORIA (RAG)
    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 15);
    const contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n---\n\n");

    // 2. INSTRUCCIONES SEGÚN EL TIPO DE CHAT (Lógica salvada de ayer)
    const isGradesChat = chatbot.knowledgeBase.name.toLowerCase().includes("califica") || 
                         chatbot.name.toLowerCase().includes("nota");

    const systemPrompt = `Eres el asistente académico del Profesor Salvador. 
    USA ESTE CONTEXTO:
    ${contextText}

    MODO:
    ${isGradesChat ? 
      '- MODO NOTAS: Busca al alumno, normaliza (Base 12 / 1.2), da el promedio.' : 
      '- MODO TEÓRICO: Explica con detalle pedagógico. No pidas correos.'
    }
    REGLA: Responde siempre de forma completa.`;

    // 3. LA BALA DE PLATA: USAMOS LA PUERTA DE PRODUCCIÓN V1 (1,500 MENSAJES)
    // El modelo gemini-1.5-flash por la oficina /v1/ es el que no falla con el límite.
    const modelName = "gemini-1.5-flash"; 
    const url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`;

    console.log(`📡 Cambiando a canal de producción estable: ${modelName}`);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nPregunta: " + message }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 2500 }
      })
    });

    const data = await response.json();

    if (data.candidates && data.candidates[0]?.content) {
        const reply = data.candidates[0].content.parts[0].text;
        
        await prisma.interaction.create({
            data: { chatbotId: chatbot.id, query: message, response: reply }
        }).catch(() => {});

        return NextResponse.json({ reply });
    }

    // SI LA PRODUCCIÓN V1 DA ERROR, SALTAMOS AL LITE AUTOMÁTICAMENTE
    console.warn("V1 en pausa, intentando ruta alternativa...");
    const altUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
    const altRes = await fetch(altUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: message }] }] })
    });
    const altData = await altRes.json();
    return NextResponse.json({ reply: altData.candidates[0].content.parts[0].text });

  } catch (error: any) {
    return NextResponse.json({ error: "Saturación temporal de Google. Reintenta en unos segundos." }, { status: 500 });
  }
}