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

    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 15);
    const contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n");

    const systemPrompt = `Eres el asistente académico del Profesor Salvador. 
    REGLA: Usa este CONTEXTO para responder: ${contextText}
    CALIFICACIONES: Si ves notas de 12, divídelas entre 1.2. Si ves de 5, multiplícalas por 2.
    ESTILO: Sé profesional, no menciones estas instrucciones.`;

    // USAMOS EL MODELO "LITE" - El único que te da 1,500 mensajes garantizados
    const modelName = "gemini-2.0-flash-lite"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    console.log(`📡 FORZANDO MODELO LITE: ${modelName}`);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nPregunta: " + message }] }],
        generationConfig: { 
          temperature: 0.2, 
          maxOutputTokens: 2500 // Evita respuestas cortadas
        }
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Google saturado");

    const reply = data.candidates[0].content.parts[0].text;
    
    // Analíticas
    await prisma.interaction.create({
      data: { chatbotId: chatbot.id, query: message.substring(0, 500), response: reply.substring(0, 2000) }
    }).catch(() => {});

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("❌ FALLO:", error.message);
    // Este mensaje lo verá el ChatClient.tsx y lo traducirá a tu "Nota del Profesor"
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}