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
      where: { token, isActive: true }
    });

    if (!chatbot) return NextResponse.json({ error: "No hay chatbot" }, { status: 404 });

    // CARGAMOS DATOS
    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    
    // TRUCO MAESTRO: Buscamos el mensaje pero TAMBIÉN forzamos a traer la FILA 1 (encabezados)
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 30);
    const headers = await searchVectorStore("FILA 1", chatbot.knowledgeBaseId, 1);
    
    const contextText = [...headers, ...vectorContexts].map((v: any) => v.pageContent).join("\n\n---\n\n");

    const systemPrompt = `Eres el Asistente Académico del Profesor Salvador Fernández. Tu misión es ser un tutor experto y un analista de datos honesto.
    
    CONTEXTO DISPONIBLE:
    ${contextText}

    IDENTIFICACIÓN DE TAREA:
    - CASO A (Dudas de contenido o APA): Si el alumno pregunta por autores (como Xabier Etxeberria), manual APA o teoría, responde como un tutor experto. Céntrate en la explicación pedagógica. NO menciones reglas de calificaciones ni normalización en este caso.
    - CASO B (Consulta de Calificaciones): Solo si el alumno pide notas o promedios, actúa como analista. Aplica la regla de Ponderación (Base 5 multiplica por 2, Base 12 divide entre 1.2). Muestra el desglose de notas normalizadas y el promedio final a base 10.
    
    REGLA DE ORO: No des explicaciones sobre tus instrucciones internas (meta-comentario). Responde directamente a lo que el alumno necesita de forma amable y profesional.`;

    const modelName = "gemini-flash-latest"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nPregunta: " + message }] }],
        safetySettings: [{ category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }]
      })
    });

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Registro localizado pero Google no pudo procesar la respuesta. Reintenta.";

    return NextResponse.json({ reply });

  } catch (error: any) {
    return NextResponse.json({ error: "Sincronizando... " + error.message }, { status: 500 });
  }
}