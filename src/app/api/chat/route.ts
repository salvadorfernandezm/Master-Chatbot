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

    // 1. CARGA DE CONTEXTO (Bajamos a 10 para máxima velocidad)
    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 10);
    const contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n---\n\n");

    const systemPrompt = `Eres el asistente académico del Profesor Salvador. 
    Usa estrictamente este CONTEXTO para responder sobre la ética del Dr. Xabier Etxeberria:
    ${contextText}
    REGLA: Si la información no está clara, di lo que encuentres. No menciones bloqueos.`;

    // 2. CONEXIÓN POR EL ALIAS LATEST (El que más te ha funcionado)
    const modelName = "gemini-flash-latest"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nPregunta del Alumno: " + message }] }],
        // APAGAMOS TODOS LOS FILTROS DE SEGURIDAD (BLOCK_NONE)
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_CIVIC_INTEGRITY", threshold: "BLOCK_NONE" }
        ],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1000 }
      })
    });

    const data = await response.json();

    // 3. LECTURA FLEXIBLE DE LA RESPUESTA
    // Si Google responde, pero el filtro de seguridad quitó el texto, usamos un plan B
    if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
      const reply = data.candidates[0].content.parts[0].text;
      
      // Guardar analíticas
      await prisma.interaction.create({
        data: { chatbotId: chatbot.id, query: message, response: reply }
      }).catch(e => console.error("Error guardando analíticas:", e));

      return NextResponse.json({ reply });
    } else {
      // Si la respuesta viene bloqueada o vacía, le damos un error real al usuario
      const errorMsg = data.error?.message || "Censura técnica de Google detectada.";
      console.error("Detalle fallo:", JSON.stringify(data));
      return NextResponse.json({ reply: `⚠️ Nota académica: El sistema de seguridad de Google restringió esta respuesta por la naturaleza del tema. Por favor, reformula tu pregunta sobre Xabier Etxeberria de forma más sencilla.` });
    }

  } catch (error: any) {
    return NextResponse.json({ error: "Sincronizando sabiduría... " + error.message }, { status: 500 });
  }
}