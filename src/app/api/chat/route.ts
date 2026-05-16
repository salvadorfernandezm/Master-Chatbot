export const dynamic = 'force-dynamic';
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { prisma } from "@/lib/prisma";
import { searchVectorStore, loadStoreFromDB } from "@/lib/vectorStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, token } = body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) return NextResponse.json({ reply: "Falta la API Key en el servidor." });

    // 1. IDENTIFICAR CHATBOT
    const chatbot = await prisma.chatbot.findUnique({
      where: { token, isActive: true },
      include: { knowledgeBase: true }
    });

    if (!chatbot) return NextResponse.json({ reply: "Chatbot no disponible." });

    // 2. CARGAR CONTEXTO (Protegido contra fallos)
    let contextText = "No hay información adicional.";
    try {
      await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
      // Bajamos a 10 para máxima velocidad y evitar errores de Timeout (500)
      const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 10);
      if (vectorContexts && vectorContexts.length > 0) {
          contextText = vectorContexts.map((v: any) => v?.pageContent || "").join("\n\n");
      }
    } catch (dbErr) {
      console.error("Error cargando contexto:", dbErr);
    }

    const systemPrompt = `Eres el asistente académico del Profesor Salvador. Contexto: ${contextText}`;

    // 3. LLAMADA A GOOGLE (Modelo camaleón)
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
        generationConfig: { temperature: 0.1, maxOutputTokens: 1500 }
      })
    });

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Lo siento, Google no respondió. Reintenta en 5 segundos.";

    // --- GUARDAR ANALÍTICA SIEMPRE ---
    try {
      await prisma.interaction.create({
        data: { chatbotId: chatbot.id, query: message.substring(0, 400), response: reply.substring(0, 2000) }
      });
    } catch (saveErr) {
      console.error("Error guardando analítica:", saveErr);
    }

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("❌ ERROR CRÍTICO:", error.message);
    return NextResponse.json({ reply: "Saturación temporal. Reintenta tu pregunta ahora." }, { status: 200 }); 
    // Usamos status 200 para que la página NO explote (Error 500) y el alumno vea el mensaje
  }
}