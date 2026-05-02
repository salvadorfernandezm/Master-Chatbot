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
      where: { token, isActive: true }
    });
    if (!chatbot) return NextResponse.json({ error: "Chatbot no encontrado" }, { status: 404 });

    // 1. CARGA DE CONTEXTO
    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 12);
    const contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n---\n\n");

    const systemPrompt = `Eres el asistente oficial del Profesor Salvador Fernández. 
    REGLA: Usa este CONTEXTO para responder: ${contextText}.
    CÁLCULO: Si ves notas, aplica el promedio normalizado (Base 12 divide entre 1.2 | Base 5 multiplica por 2).
    ÉTICA: Para el Dr. Xabier Etxeberria, explica con detalle el 'Mapa de la ética'. No cortes la respuesta.`;

    // 2. LA BALA DE PLATA: GEMINI 2.0 LITE
    // Usamos el nombre exacto que Google acepta para cuota alta
    const modelName = "gemini-2.0-flash-lite"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    console.log("-----------------------------------------");
    console.log(`🚀 DESPEGUE SEGURO CON: ${modelName}`);
    console.log("-----------------------------------------");

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nPregunta: " + message }] }],
        generationConfig: { 
            temperature: 0.1, 
            maxOutputTokens: 2000 // Micrófono abierto para Etxeberria
        },
        safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error?.message || "Google saturado");
    }

    const reply = data.candidates[0].content.parts[0].text;

    // 3. GUARDAR ANALÍTICAS
    await prisma.interaction.create({
      data: { chatbotId: chatbot.id, query: message.substring(0, 500), response: reply.substring(0, 2000) }
    }).catch(e => console.error("Aviso analíticas:", e));

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("❌ FALLO:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}