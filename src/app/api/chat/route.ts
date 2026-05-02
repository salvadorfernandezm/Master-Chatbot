export const dynamic = 'force-dynamic';
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, token } = body;
    const apiKey = process.env.GEMINI_API_KEY;

    // 1. IDENTIFICAR CHATBOT Y SU BASE
    const chatbot = await prisma.chatbot.findUnique({
      where: { token, isActive: true }
    });

    if (!chatbot) return NextResponse.json({ error: "Chatbot no encontrado" }, { status: 404 });

    // 2. LECTURA DIRECTA DE SUPABASE (BYPASS DE VECTORES)
    // Buscamos TODOS los fragmentos que pertenezcan a la base de este chatbot
    const chunks = await prisma.documentChunk.findMany({
      where: { knowledgeBaseId: chatbot.knowledgeBaseId },
      select: { content: true } // Solo nos interesa el texto
    });

    // Unimos todo el conocimiento en un solo bloque de texto
    const allKnowledge = chunks.map(c => c.content).join("\n\n---\n\n");

    console.log(`📚 Sistema cargado con ${chunks.length} fragmentos de la base: ${chatbot.knowledgeBaseId}`);

    // 3. PROMPT DE MAESTRÍA
    const systemPrompt = `Eres el asistente académico del Profesor Salvador. 
    ESTA ES TU FUENTE DE VERDAD ABSOLUTA PARA ESTE CHAT:
    
    ${allKnowledge || "AVISO: No se encontraron documentos cargados para este chat."}

    INSTRUCCIONES:
    - Responde únicamente basado en el texto de arriba. 
    - Si preguntan por Dr. Xabier Etxeberria, usa la sabiduría de la trascripción.
    - Si preguntan por notas, busca al alumno y aplica la normalización (Base 12 divide entre 1.2).
    - NUNCA pidas correo ni nombre si la pregunta es teórica (como "¿Qué es la moral?").
    - Si la fuente está arriba, DEBES responder con detalle. No digas que no tienes acceso.`;

    // 4. LLAMADA A GEMINI (OFICINA V1BETA PARA TU CUENTA 2.0)
    const modelName = "gemini-2.0-flash-lite"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nConsulta del Estudiante: " + message }] }],
        safetySettings: [
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ],
        generationConfig: { temperature: 0.1, maxOutputTokens: 2048 }
      })
    });

    const data = await response.json();
    
    if (data.candidates && data.candidates[0]?.content) {
        const reply = data.candidates[0].content.parts[0].text;
        
        // Guardar para tus maravillosas analíticas
        await prisma.interaction.create({
            data: { chatbotId: chatbot.id, query: message, response: reply }
        }).catch(() => {});

        return NextResponse.json({ reply });
    }

    return NextResponse.json({ reply: "Lo siento, tuve un problema al procesar la sabiduría de los textos. ¿Podrías repetir tu pregunta?" });

  } catch (error: any) {
    console.error("❌ ERROR EN RUTA:", error.message);
    return NextResponse.json({ error: "Sincronizando con la nube... intenta de nuevo." }, { status: 500 });
  }
}