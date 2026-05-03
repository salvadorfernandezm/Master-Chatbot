export const dynamic = 'force-dynamic';
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { prisma } from "@/lib/prisma";
import { searchVectorStore, loadStoreFromDB } from "@/lib/vectorStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, token } = body;
    const apiKey = process.env.GEMINI_API_KEY;

    console.log("-----------------------------------------");
    console.log("🚀 EJECUTANDO VERSIÓN DE PRODUCCIÓN ESTABLE /v1/");
    console.log("-----------------------------------------");

    if (!apiKey) return NextResponse.json({ error: "Falta API Key" }, { status: 500 });

    const chatbot = await prisma.chatbot.findUnique({
      where: { token, isActive: true },
    });
    if (!chatbot) return NextResponse.json({ error: "Chatbot no encontrado" }, { status: 404 });

    // CARGAR CONTEXTO
    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 15);
    const contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n---\n\n");

    const systemPrompt = `Eres un asistente académico. Usa este contexto: ${contextText}. Responde directo y pedagógico.`;

    // --- EL MOMENTO DE LA VERDAD ---
    // Usamos el endpoint /v1/ (Estable) y el modelo 1.5 Flash.
    // Esta combinación es la que da los 1,500 mensajes gratuitos.
    const modelName = "gemini-1.5-flash"; 
    const url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`;

    console.log(`📡 Intentando conectar a la Oficina de Producción: ${modelName}`);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nPregunta: " + message }] }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
        // Si el 1.5 sigue bloqueado, probaremos con el modelo gemini-pro original
        console.warn("Falla 1.5 en V1, probando modelo pro...");
        const fallbackUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`;
        const res2 = await fetch(fallbackUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: message }] }] })
        });
        const data2 = await res2.json();
        
        if (!res2.ok) {
            console.error("❌ FALLO TOTAL:", JSON.stringify(data2));
            throw new Error(data2.error?.message || "Google sigue restringiendo el acceso.");
        }
        return NextResponse.json({ reply: data2.candidates[0].content.parts[0].text });
    }

    const reply = data.candidates[0].content.parts[0].text;
    
    // Guardamos la interacción para tus gráficas
    await prisma.interaction.create({
      data: { chatbotId: chatbot.id, query: message.substring(0,500), response: reply.substring(0,2000) }
    }).catch(() => {});

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("❌ ERROR DETECTADO:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}