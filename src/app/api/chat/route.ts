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
    if (!chatbot) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    
    // TRUCO DE PRECISIÓN: Buscamos el mensaje pero forzamos a traer siempre la parte superior de la tabla
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 25);
    const headers = await searchVectorStore("Fila 1 actividades nombres", chatbot.knowledgeBaseId, 3);
    
    const contextText = [...headers, ...vectorContexts].map((v: any) => v.pageContent).join("\n\n---\n\n");

    const systemPrompt = `Eres el clon digital y asistente académico del Profesor Salvador Fernández Martínez. 
    Tu fuente de datos incluye el Cronograma y el Acta de Calificaciones.
    
    INSTRUCCIONES DE ALTA PRECISIÓN:
    1. ETIQUETADO REAL: En el documento de calificaciones, la FILA 1 tiene los nombres de las actividades (ej: Act 1 Plenario, Act 2 Conferencia, etc.). 
       - ¡NO digas "Nota 1"! Busca el nombre real en la cabecera de la columna y úsalo.
    
    2. CÁLCULO PONDERADO: 
       - Si una actividad (como Act 5) tiene un valor real de 12.0, divídela entre 1.2 para obtener su peso en Base 10.
       - Si una actividad tiene base 5, multiplícala por 2.
       - Suma las 5 actividades normalizadas y divide entre 5 para dar el PROMEDIO FINAL sobre 10.
    
    3. PERSONALIDAD: Sé amable, usa los recordatorios del cronograma pero aclara que son para referencia del semestre actual. Felicita por los logros específicos.
    
    CONTEXTO:
    ${contextText}`;

    const modelName = "gemini-flash-latest"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nUsuario: " + message }] }],
        safetySettings: [{ category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 2500 }
      })
    });

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Lo siento, ¿podrías repetirme tu nombre o correo?";

    return NextResponse.json({ reply });

  } catch (error: any) {
    return NextResponse.json({ error: "Sincronizando: " + error.message }, { status: 500 });
  }
}