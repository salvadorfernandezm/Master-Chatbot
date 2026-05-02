export const dynamic = 'force-dynamic';
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { prisma } from "@/lib/prisma";
import { searchVectorStore, loadStoreFromDB } from "@/lib/vectorStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, token } = body;
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!apiKey) return NextResponse.json({ error: "Falta API Key" }, { status: 500 });

    const chatbot = await prisma.chatbot.findUnique({
      where: { token, isActive: true },
    });
    if (!chatbot) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    // SUBIMOS A 25 FRAGMENTOS para que las notas no se queden fuera por culpa del cronograma
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 25);
    const contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n---\n\n");

    const systemPrompt = `Eres el asistente académico oficial del Profesor Salvador Fernández Martínez. 
    A continuación tienes fragmentos de los documentos del curso (pueden ser cronogramas, listas de asistencia o tablas de notas):
    
    --- DATOS EXTRAÍDOS ---
    ${contextText}
    --- FIN DE LOS DATOS ---

    INSTRUCCIONES PARA RESPONDER:
    1. Si el alumno pregunta por sus notas o promedio, busca en los DATOS EXTRAÍDOS una fila o línea que contenga su NOMBRE o su CORREO ELECTRÓNICO.
    2. Cuando encuentres la línea del alumno, lee las cifras que tiene asociadas (suelen ser las notas de Act 1, 2, 4, 5 y 6).
    3. RECUERDA LA REGLA MATEMÁTICA: 
       - Si una nota es de 12 puntos (como suele ser la Actividad 5), divídela entre 1.2 para el promedio. 
       - Si es de 5 puntos, multiplícala por 2. 
       - Saca el promedio final en escala 10.
    4. Si solo encuentras el Cronograma, dile al alumno: "Veo el cronograma de fechas, pero no localizo tu registro de notas en este fragmento. ¿Podrías darme tu correo institucional o nombre completo para volver a intentar?".`;

    const modelName = "gemini-2.0-flash-lite"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nUsuario: " + message }] }],
        safetySettings: [{ category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }],
        generationConfig: { temperature: 0.1 }
      })
    });

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Lo siento, ¿podrías repetirme tu nombre o correo?";

    return NextResponse.json({ reply });

  } catch (error: any) {
    return NextResponse.json({ error: "Sincronizando: " + error.message }, { status: 500 });
  }
}