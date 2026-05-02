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

    const systemPrompt = `Eres el Asistente Académico del Profesor Salvador Fernández.
    TU FUENTE DE DATOS OFICIAL (Incluye la FILA 1 con nombres de actividades):
    ${contextText}

    TAREA: Localiza la fila del alumno (por correo o nombre) y realiza el siguiente análisis:
    
    1. DETERMINA LA ESCALA DE CADA ACTIVIDAD: Observa el valor máximo de cada columna. 
       - Si las notas rondan el 12, asume escala 12 (divisor 1.2).
       - Si las notas rondan el 5, asume escala 5 (multiplicador 2 o divisor 0.5).
       - Por defecto, la escala es 10.
    
    2. NORMALIZACIÓN A BASE 10: Convierte cada nota a una escala de 10 puntos.
       - Fórmula: (Nota obtenida / Escala máxima de esa actividad) * 10.
       - Ejemplo: 12/12 = 10. | 4/5 = 8. | 9/10 = 9.

    3. CÁLCULO DEL PROMEDIO: Suma las 5 notas YA NORMALIZADAS y divide entre 5.
    
    4. FORMATO DE RESPUESTA: 
       - Lista las actividades con su nombre original (Fila 1).
       - Muestra la nota real y, entre paréntesis, la nota normalizada si la escala era distinta a 10.
       - Da el promedio final normalizado a base 10 y felicita al alumno.
    
    IMPORTANTE: Si no hay datos para una actividad, menciónalo como "Pendiente" o 0 según corresponda en el archivo.`;

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