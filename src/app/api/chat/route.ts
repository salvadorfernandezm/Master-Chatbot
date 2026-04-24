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

    // 1. CARGA DE CONTEXTO (Buscando a Alondra)
    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 25);
    const contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n---\n\n");

    // 2. PROMPT DE AUTORIDAD (Aquí está la clave)
    const systemPrompt = `ATENCIÓN: Eres el asistente del Prof. Salvador. 
    A CONTINUACIÓN SE ENCUENTRA TU BASE DE DATOS OFICIAL. ES TU ÚNICA FUENTE DE VERDAD.
    
    INFORMACIÓN DE LOS ARCHIVOS:
    ${contextText || "No hay datos cargados."}

    REGLAS:
    - SI EL USUARIO DICE "SOY ALONDRA" O PREGUNTA POR "ALONDRA", BUSCA EN LOS DATOS DE ARRIBA.
    - EL ARCHIVO CONTIENE UN JSON CON CALIFICACIONES Y ASISTENCIAS.
    - "absent" significa FALTA.
    - NUNCA digas que no tienes acceso a archivos. Los datos de arriba SON tus archivos.
    - Responde de forma amable y directa.`;

    // 3. MODELO LITE (El que ya vimos que funciona)
    const modelName = "gemini-2.0-flash-lite"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nPregunta del Alumno: " + message }] }],
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" }
        ],
        generationConfig: { temperature: 0.1 }
      })
    });

    const data = await response.json();

    if (data.candidates && data.candidates[0].content) {
      const reply = data.candidates[0].content.parts[0].text;
      return NextResponse.json({ reply });
    } else {
      return NextResponse.json({ reply: "No encontré el registro. ¿Podrías darme tu correo o nombre completo para buscar mejor?" });
    }

  } catch (error: any) {
    return NextResponse.json({ error: "Sincronizando... " + error.message }, { status: 500 });
  }
}