export const dynamic = 'force-dynamic';
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, token } = body;
    const apiKey = process.env.GEMINI_API_KEY;

    // 1. LOCALIZAR EL CHATBOT
    const chatbot = await prisma.chatbot.findUnique({
      where: { token, isActive: true }
    });
    if (!chatbot) return NextResponse.json({ error: "Chatbot no encontrado" }, { status: 404 });

    // 2. LEER DATOS (Solo los 15 más relevantes para no saturar)
    // Buscamos fragmentos que contengan palabras de la pregunta
    const words = message.toLowerCase().split(' ').filter(w => w.length > 3);
    const chunks = await prisma.documentChunk.findMany({
      where: {
        knowledgeBaseId: chatbot.knowledgeBaseId,
        OR: words.length > 0 ? words.map(w => ({ content: { contains: w, mode: 'insensitive' } })) : undefined
      },
      take: 15
    });

    // Si la búsqueda por palabra falla, traemos los primeros 10 de esa base
    const finalChunks = chunks.length > 0 ? chunks : await prisma.documentChunk.findMany({
      where: { knowledgeBaseId: chatbot.knowledgeBaseId },
      take: 10
    });

    const contextText = finalChunks.map(c => c.content).join("\n\n---\n\n");

    // 3. PREPARAR EL MENSAJE
    const systemPrompt = `Eres un asistente académico. Responde usando este CONTEXTO:\n${contextText}\n
    REGLA: Sé directo y pedagógico. Si es sobre notas, calcúla el promedio normalizado.`;

    // 4. LLAMADA A GOOGLE (USANDO EL NOMBRE "LATEST" QUE ES EL MÁS ESTABLE)
    const modelName = "gemini-1.5-flash-latest"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nPregunta: " + message }] }],
        safetySettings: [
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" }
        ],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1000 }
      })
    });

    const data = await response.json();

    // 5. DETECTOR DE VERDAD
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        const reply = data.candidates[0].content.parts[0].text;
        // Guardamos analíticas
        await prisma.interaction.create({
            data: { chatbotId: chatbot.id, query: message, response: reply }
        }).catch(() => {});
        return NextResponse.json({ reply });
    } 

    // SI GOOGLE DA ERROR, LO MOSTRAMOS
    const googleError = data.error?.message || "Google bloqueó la respuesta por seguridad de contenido.";
    return NextResponse.json({ reply: `⚠️ Error de Google: ${googleError}` });

  } catch (error: any) {
    return NextResponse.json({ error: "Sincronizando con el servidor..." }, { status: 500 });
  }
}