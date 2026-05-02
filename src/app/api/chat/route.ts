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
    
    // Traemos contexto suficiente pero enfocado
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 25);
    const contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n---\n\n");

    const systemPrompt = `Eres el asistente oficial del Profesor Salvador Fernández Martínez. 
    TU ÚNICA FUENTE DE VERDAD NUMÉRICA ES EL EXCEL (Fragmentos que empiezan con "REGISTRO ACADÉMICO").
    
    INSTRUCCIONES OBLIGATORIAS:
    1. IDENTIFICACIÓN: Busca la línea exacta que corresponde a "${message}" (o el nombre/correo detectado).
    2. EXTRACCIÓN LITERAL: Toma los números tal cual aparecen en esa fila del EXCEL. NO inventes actividades que no estén en esa fila específica.
    3. REGLAS DE NOMBRES Y CÁLCULO:
       - Act. 1 Plenario Dignidad: Úsala tal cual.
       - Act. 2 Conferencia: Úsala tal cual.
       - Act. 4 Código: Úsala tal cual.
       - Act. 5 Moral ética meta: Vale 12. DIVIDE ENTRE 1.2 para el promedio. (Ej: 12.0 / 1.2 = 10.0).
       - Act 6 Examen 1: Úsala tal cual.
    4. SI NO HAY NOTA: Si una actividad no tiene número en esa fila, di "Sin calificar". NO inventes notas de 4.5 o 9.5.
    
    PROCESO:
    Suma las notas (normalizando la Act 5) y divide entre el número de actividades calificadas.
    
    DATOS DEL SISTEMA:
    ${contextText}`;

    const modelName = "gemini-flash-latest"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nUsuario: " + message }] }],
        safetySettings: [{ category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }],
        generationConfig: { temperature: 0.0, maxOutputTokens: 1500 } // Temperatura 0 para evitar creatividad
      })
    });

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Lo siento, ¿podrías ser más específico con tu nombre?";

    return NextResponse.json({ reply });

  } catch (error: any) {
    return NextResponse.json({ error: "Sincronizando: " + error.message }, { status: 500 });
  }
}