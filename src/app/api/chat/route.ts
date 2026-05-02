export const dynamic = 'force-dynamic';
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, token } = body;
    const apiKey = process.env.GEMINI_API_KEY;

    const chatbot = await prisma.chatbot.findUnique({
      where: { token, isActive: true }
    });
    if (!chatbot) return NextResponse.json({ error: "Chatbot no encontrado" }, { status: 404 });

    // 1. BUSCADOR INTELIGENTE: Identificamos palabras clave (Email o Nombres)
    const rawWords = message.toLowerCase().split(/[ ,.!@]+/);
    const keywords = rawWords.filter((w: string) => w.length > 3);
    
    const chunks = await prisma.documentChunk.findMany({
      where: {
        knowledgeBaseId: chatbot.knowledgeBaseId,
        OR: keywords.map((w: string) => ({ content: { contains: w, mode: 'insensitive' } }))
      },
      take: 20 // Subimos a 20 para tener más variedad de páginas
    });

    // 2. RESPALDO: Si no hay palabras clave, traemos lo más reciente
    const finalChunks = chunks.length > 0 ? chunks : await prisma.documentChunk.findMany({
      where: { knowledgeBaseId: chatbot.knowledgeBaseId },
      take: 15
    });

    const contextText = finalChunks.map(c => c.content).join("\n\n---\n\n");

    // 3. INSTRUCCIONES DE MAESTRÍA (Eliminamos la timidez de Gemini)
    const systemPrompt = `Eres "${chatbot.name}", el asistente del Prof. Salvador.
    TU FUENTE DE VERDAD ES ESTE CONTEXTO:
    ${contextText}

    PROTOCOLO DE RESPUESTA:
    1. SI PIDEN NOTAS/CALIFICACIONES: Busca el nombre o correo del alumno en los datos de arriba. 
       - Si ves números y un nombre, esa ES la sábana de notas. NO digas que no tienes acceso.
       - Aplica la normalización (Base 12 divide entre 1.2, Base 5 multiplica por 2).
    2. SI PIDEN APA O ETXEBERRIA: Explica de forma completa. 
       - Si el fragmento menciona una sección (ej: 6.46), úsala pero complementa con la regla general del manual.
    3. REGLA DE ORO: No seas tímido. Si ves la información arriba, el usuario confía en que la procesarás.`;

"IMPORTANTE: Extrae los nombres de las actividades directamente de la FILA 1 de los datos. No digas 'Actividad 1', di '[Nombre de la columna]'. De esa forma Alondra verá: 'Plenario Dignidad: 10.0'."

    const modelName = "gemini-flash-latest"; 
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
        generationConfig: { temperature: 0.2, maxOutputTokens: 2000 }
      })
    });

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Lo siento, tuve un problema de conexión con el cerebro central. Reintenta ahora mismo.";

    return NextResponse.json({ reply });

  } catch (error: any) {
    return NextResponse.json({ error: "Sincronizando sabiduría..." }, { status: 500 });
  }
}