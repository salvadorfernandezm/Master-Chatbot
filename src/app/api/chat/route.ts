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
      where: { token, isActive: true },
    });

    if (!chatbot) return NextResponse.json({ error: "Chatbot no encontrado" }, { status: 404 });

    // 1. CARGAR CONTEXTO (Bajamos a 15 fragmentos para que sea ultra rápido)
    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 15);
    const contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n");

    const systemPrompt = `Eres un asistente académico experto. Usa este contexto: ${contextText}. Responde de forma clara y directa.`;

    // 2. EL MODELO DE ALTA DISPONIBILIDAD (1,500 mensajes/día)
    // Cambiamos 'gemini-2.0-flash' por 'gemini-1.5-flash'
    // Y usamos la versión de API 'v1' que es la más estable
    const modelName = "gemini-1.5-flash"; 
    const url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`;

    console.log(`🚀 Conectando al modelo de producción: ${modelName}`);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nPregunta: " + message }] }],
        generationConfig: { 
          temperature: 0.7,
          maxOutputTokens: 2000
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
        console.error("❌ ERROR DE CUOTA GOOGLE:", data.error?.message);
        // Si el 1.5 falla por alguna razón, intentamos el 2.0 LITE como último recurso
        const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`;
        const fallbackRes = await fetch(fallbackUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt + message }] }] })
        });
        const fallbackData = await fallbackRes.json();
        return NextResponse.json({ reply: fallbackData.candidates[0].content.parts[0].text });
    }

    const reply = data.candidates[0].content.parts[0].text;

    // 3. GUARDAR ANALÍTICAS (Esto ya sabemos que funciona)
    await prisma.interaction.create({
      data: { chatbotId: chatbot.id, query: message.substring(0, 500), response: reply.substring(0, 2000) }
    }).catch(e => console.error("Error analíticas:", e));

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("❌ FALLO TOTAL EN LA RUTA:", error.message);
    return NextResponse.json({ error: "Estamos ajustando la conexión. Por favor, reintenta en 10 segundos." }, { status: 500 });
  }
}