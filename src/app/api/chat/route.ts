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

    // 1. IDENTIFICAR CHATBOT Y SU CONFIGURACIÓN
    const chatbot = await prisma.chatbot.findUnique({
      where: { token, isActive: true },
      include: { knowledgeBase: true } // Traemos la info de su base
    });

    if (!chatbot) return NextResponse.json({ error: "Chatbot no encontrado o inactivo" }, { status: 404 });

    // 2. BUSCAR CONTEXTO FILTRADO POR SU BASE ESPECÍFICA
    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 15);
    const contextText = vectorContexts.map(v => v.pageContent).join("\n\n---\n\n");

    // 3. CONSTRUIR EL PROMPT CON IDENTIDAD
    const systemPrompt = `Eres el asistente oficial: "${chatbot.name}".
    INSTRUCCIONES DEL PROFESOR: ${chatbot.systemInstructions || "Responde con precisión."}
    
    TU FUENTE DE DATOS EXCLUSIVA (CONTEXTO):
    ${contextText || "No hay documentos cargados en esta base."}

    REGLA DE ORO: Si el usuario pregunta por información que está en el CONTEXTO anterior (como notas o reglas APA), DEBES usarla. No digas que no tienes acceso a archivos, porque el texto de arriba ES el contenido de tus archivos.`;

    // 4. LLAMADA A GEMINI (Usando el alias camaleón que nos funcionó)
    const modelName = "gemini-flash-latest";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: systemPrompt + "\n\nUsuario: " + message }]
        }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 2500 }
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Error en Google");

    const reply = data.candidates[0].content.parts[0].text;

    // 5. GUARDAR PARA ANALÍTICAS (Esto activará tus gráficas)
    // Usamos un try/catch interno para que si falla el guardado, el chat siga funcionando
    try {
      await prisma.interaction.create({
        data: {
          chatbotId: chatbot.id,
          query: message,
          response: reply
        }
      });
    } catch (e) {
      console.error("Error guardando analíticas:", e);
    }

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("❌ FALLO:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}