export const dynamic = 'force-dynamic';
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { prisma } from "@/lib/prisma";
import { searchVectorStore, loadStoreFromDB } from "@/lib/vectorStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, token } = body;
    const apiKey = process.env.GEMINI_API_KEY;

    // 1. IDENTIFICAR AL CHATBOT
    const chatbot = await prisma.chatbot.findUnique({
      where: { token, isActive: true },
      include: { knowledgeBase: true }
    });

    if (!chatbot) return NextResponse.json({ error: "Chatbot no encontrado" }, { status: 404 });

    // 2. CARGAR TODO EL CONTEXTO (Usamos tu modo "Visión Total" de ayer)
    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 30);
    const contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n---\n\n");

    // 3. PROMPT DINÁMICO (Identifica si busca Notas o Contenido)
    const systemPrompt = `Eres "${chatbot.name}", el asistente oficial del Profesor Salvador.
    TU BASE DE DATOS ES ESTA (Contiene Manual APA, Ética de Etxeberria y Calificaciones):
    ${contextText}

    MODO DE RESPUESTA:
    A) SI LA PREGUNTA ES ACADÉMICA (Moral, Cursivas, Autores, APA):
       - Responde de forma detallada y pedagógica usando el texto de arriba. 
       - ¡NO pidas correos ni apellidos en este modo! Explica el concepto y ya.
    
    B) SI LA PREGUNTA ES SOBRE CALIFICACIONES O PROMEDIOS:
       - Solo entonces, busca al alumno por nombre o correo. 
       - Si no encuentras al alumno en los fragmentos de arriba, di: "No localizo tu registro en los documentos actuales. ¿Podrías verificar tu nombre o correo?"
    
    C) REGLA GENERAL: Responde siempre con profesionalismo y cita el documento o autor si aparece arriba.`;

    const modelName = "gemini-2.0-flash-lite"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nPregunta: " + message }] }],
        generationConfig: { temperature: 0.1 }
      })
    });

    const data = await response.json();
    
    if (data.candidates && data.candidates[0].content) {
        return NextResponse.json({ reply: data.candidates[0].content.parts[0].text });
    } 

    return NextResponse.json({ reply: "Lo siento, tuve un problema al consultar los archivos. ¿Puedes intentar de nuevo?" });

  } catch (error: any) {
    return NextResponse.json({ error: "Sincronizando: " + error.message }, { status: 500 });
  }
}