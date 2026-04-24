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

    const chatbot = await prisma.chatbot.findUnique({ where: { token, isActive: true } });
    if (!chatbot) return NextResponse.json({ error: "Chatbot no encontrado" }, { status: 404 });

    // 1. CARGAR CONTEXTO
    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 25);
    const contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n");

    const systemPrompt = `Eres el asistente académico del Prof. Salvador. 
    Usa este contexto: ${contextText}. 
    CÁLCULO: Si una nota es sobre 12, divídela entre 1.2 para el promedio base 10.
    INSTRUCCIÓN: Responde de forma breve y directa.`;

    // 2. ESTRATEGIA DE MODELOS (INTENTAREMOS LA PUERTA ESTABLE V1)
    // El modelo 1.5-flash en V1 es el que tiene los 1,500 mensajes garantizados.
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nPregunta: " + message }] }],
        safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ],
        generationConfig: { temperature: 0.1 }
      })
    });

    const data = await response.json();

    // 3. SI LA PUERTA ESTABLE FALLA, INTENTAMOS EL MODELO 8B (EL ÚLTIMO RECURSO)
    if (!response.ok) {
        console.warn("Fallo en V1, intentando modelo 8b de emergencia...");
        const altUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent?key=${apiKey}`;
        const altRes = await fetch(altUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt + message }] }] })
        });
        const altData = await altRes.json();
        
        if (!altRes.ok) {
            return NextResponse.json({ reply: `⚠️ Nota del Profesor: Google está saturado. El error es: ${altData.error?.message}. Por favor, descansa 5 minutos e intenta de nuevo.` });
        }
        return NextResponse.json({ reply: altData.candidates[0].content.parts[0].text });
    }

    const reply = data.candidates[0].content.parts[0].text;
    return NextResponse.json({ reply });

  } catch (error: any) {
    return NextResponse.json({ error: "Sincronizando... " + error.message }, { status: 500 });
  }
}