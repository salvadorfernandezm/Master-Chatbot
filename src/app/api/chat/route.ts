export const dynamic = 'force-dynamic';
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { prisma } from "@/lib/prisma";
import { searchVectorStore, loadStoreFromDB } from "@/lib/vectorStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, token } = body;
    const apiKey = process.env.GEMINI_API_KEY;

    // 1. IDENTIFICAR CHATBOT
    const chatbot = await prisma.chatbot.findUnique({
      where: { token, isActive: true },
    });

    if (!chatbot) return NextResponse.json({ error: "Chatbot no encontrado" }, { status: 404 });

    // 2. CARGAR CONTEXTO (RAG)
    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 10);
    const contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n");

    const systemPrompt = `Eres un asistente académico. Contexto: ${contextText}. Responde de forma directa y profesional.`;

    // 3. LLAMADA A GOOGLE (Modelo 2.0 o 2.5 según tu cuenta)
    const modelName = "gemini-2.0-flash"; // El que nos funcionó en la última prueba
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nUsuario: " + message }] }]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error?.message || "Error en Google");
    }

    const reply = data.candidates[0].content.parts[0].text;

    // --- EL TAQUÍGRAFO (GUARDAR EN DB) ---
    // Lo ponemos antes del return para asegurar que se guarde
    try {
      await prisma.interaction.create({
        data: {
          chatbotId: chatbot.id,
          query: message.substring(0, 500), // Limitamos por seguridad
          response: reply.substring(0, 2000)
        }
      });
      console.log("✅ Interacción guardada en Supabase");
    } catch (dbError) {
      console.error("❌ No se pudo guardar la analítica:", dbError);
    }

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("❌ FALLO:", error.message);
    return NextResponse.json({ error: "Reintentando conexión..." }, { status: 500 });
  }
}