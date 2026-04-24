export const dynamic = 'force-dynamic';
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { prisma } from "@/lib/prisma";
import { searchVectorStore, loadStoreFromDB } from "@/lib/vectorStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, token } = body;
    const apiKey = process.env.GEMINI_API_KEY;

    const chatbot = await prisma.chatbot.findUnique({ where: { token, isActive: true } });
    if (!chatbot) return NextResponse.json({ error: "Chatbot no encontrado" }, { status: 404 });

    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 25);
    const contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n---\n\n");

    const systemPrompt = `Eres el asistente académico del Prof. Salvador. Tu misión es dar información exacta y realizar cálculos de promedios ponderados.
    
    CONTEXTO DE DATOS:
    ${contextText}

    LÓGICA DE CALIFICACIONES (SISTEMA DE PONDERACIÓN):
    1. Identifica al alumno y sus notas por actividad.
    2. DETERMINA LA ESCALA: Para cada actividad, observa el valor máximo posible. 
       - Si las notas rondan el 5, la escala es 5.
       - Si hay notas mayores a 10 (como 12), la escala es 12.
       - Por defecto, si no hay indicios, la escala es 10.
    3. NORMALIZACIÓN A BASE 10: Convierte cada nota a escala 10 usando la fórmula: (Nota obtenida / Escala Máxima) * 10.
       - Ejemplo: Un 4.5 en escala 5 se convierte en 9.0.
       - Ejemplo: Un 12.0 en escala 12 se convierte en 10.0.
    4. CÁLCULO FINAL: Suma las notas normalizadas y divide entre el número total de actividades.
    5. EXPLICACIÓN: Muestra el desglose indicando qué escala detectaste para cada actividad para que el alumno entienda el proceso.

    INSTRUCCIÓN GENERAL: Sé amable, profesional y usa exclusivamente los datos proporcionados. Si no hay datos, pide el nombre o correo.`;

    const modelName = "gemini-2.0-flash-lite"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nPregunta: " + message }] }],
        safetySettings: [{ category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }],
        generationConfig: { temperature: 0.1 }
      })
    });

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Lo siento, no pude procesar el cálculo. Reintenta por favor.";

    return NextResponse.json({ reply });

  } catch (error: any) {
    return NextResponse.json({ error: "Sincronizando: " + error.message }, { status: 500 });
  }
}