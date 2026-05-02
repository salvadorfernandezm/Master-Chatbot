export const dynamic = 'force-dynamic';
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, token } = body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) return NextResponse.json({ error: "Falta API Key" }, { status: 500 });

    const chatbot = await prisma.chatbot.findUnique({
      where: { token, isActive: true }
    });
    if (!chatbot) return NextResponse.json({ error: "Chatbot no encontrado" }, { status: 404 });

    // --- BUSCADOR CORREGIDO PARA TYPESCRIPT ---
    const words = message.toLowerCase().split(' ').filter((w: string) => w.length > 3);
    
    let chunks = await prisma.documentChunk.findMany({
      where: {
        knowledgeBaseId: chatbot.knowledgeBaseId,
        OR: words.length > 0 ? words.map((w: string) => ({ content: { contains: w, mode: 'insensitive' } })) : undefined
      },
      take: 15
    });

    if (chunks.length === 0) {
      chunks = await prisma.documentChunk.findMany({
        where: { knowledgeBaseId: chatbot.knowledgeBaseId },
        take: 10
      });
    }

    const contextText = chunks.map(c => c.content).join("\n\n---\n\n");

    const systemPrompt = `Eres un asistente académico del Profesor Salvador. 
    Usa exclusivamente este CONTEXTO para responder:\n${contextText}\n\n
    REGLA: Si la consulta es teórica (Etxeberria o APA), responde directamente. 
    Si es sobre calificaciones, normaliza el promedio. NO inventes nada.`;

    // USAMOS EL ALIAS UNIVERSAL (GRIFO ABIERTO)
    const modelName = "gemini-flash-latest"; 
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
        generationConfig: { temperature: 0.1, maxOutputTokens: 1500 }
      })
    });

    const data = await response.json();

    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        const reply = data.candidates[0].content.parts[0].text;
        
        // Guardamos analíticas para el lunes
        await prisma.interaction.create({
            data: { chatbotId: chatbot.id, query: message.substring(0, 500), response: reply.substring(0, 2000) }
        }).catch(() => {});
        
        return NextResponse.json({ reply });
    } 

    const googleError = data.error?.message || "Google bloqueó la respuesta por seguridad de contenido.";
    return NextResponse.json({ reply: `⚠️ Error de Google: ${googleError}` });

  } catch (error: any) {
    return NextResponse.json({ error: "Sincronizando: " + error.message }, { status: 500 });
  }
}