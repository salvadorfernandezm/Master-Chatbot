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
    console.log("🚀 EJECUTANDO RAG CHAT VERSIÓN FINAL (8b)");
    console.log("-----------------------------------------");

    if (!apiKey) return NextResponse.json({ error: "Falta API Key" }, { status: 500 });

    const chatbot = await prisma.chatbot.findUnique({
      where: { token, isActive: true },
      include: { knowledgeBase: true }
    });

    if (!chatbot) return NextResponse.json({ error: "Chatbot no encontrado" }, { status: 404 });

    // CARGAR CONTEXTO CON PROTECCIÓN
    let contextText = "No hay documentos cargados.";
    try {
        await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
        const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 15);
        if (vectorContexts && vectorContexts.length > 0) {
            contextText = vectorContexts.map(v => v?.pageContent || "").join("\n\n---\n\n");
        }
    } catch (err) {
        console.warn("⚠️ Advertencia en búsqueda de vectores:", err.message);
    }

    const systemPrompt = `Eres un asistente académico. Contexto: ${contextText}. Responde directo.`;

    // --- EL MODELO QUE NUNCA TIENE LÍMITE 0 ---
    // El 1.5-flash-8b es el 'plebeyo' oficial de Google. 1,500 mensajes garantizados.
    const modelName = "gemini-1.5-flash-8b"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    console.log(`📡 Llamando al modelo de alta disponibilidad: ${modelName}`);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nPregunta: " + message }] }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
        console.error("❌ GOOGLE RECHAZÓ EL PEDIDO:", JSON.stringify(data));
        throw new Error(data.error?.message || "Error de cuota");
    }

    const reply = data.candidates[0].content.parts[0].text;
    
    await prisma.interaction.create({
      data: { chatbotId: chatbot.id, query: message, response: reply }
    }).catch(() => {});

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("❌ FALLO:", error.message);
    return NextResponse.json({ error: "El servidor de Google está procesando datos. Reintenta en 10 segundos." }, { status: 500 });
  }
}