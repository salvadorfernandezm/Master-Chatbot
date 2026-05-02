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

    // 1. CARGA DE CONTEXTO
    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 15);
    const contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n---\n\n");

    // 2. PROMPT OPTIMIZADO
    const systemPrompt = `Eres el asistente académico del Profesor Salvador. 
    Usa este CONTEXTO para responder sobre la ética del Dr. Xabier Etxeberria:
    ${contextText}
    
    INSTRUCCIONES:
    - Responde de forma completa. No te cortes a mitad de frase.
    - Si el tema es sobre valores, virtudes o principios, usa el mapa de la ética citado.
    - Sé conciso pero pedagógico.`;

    // 3. CONEXIÓN (CON MÁS TOKENS DE SALIDA)
    const modelName = "gemini-flash-latest"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nUsuario: " + message }] }],
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ],
        generationConfig: { 
          temperature: 0.3, 
          maxOutputTokens: 2500, // <--- SUBIMOS EL LÍMITE AQUÍ PARA EVITAR EL CORTE
          topP: 0.95 
        }
      })
    });

    const data = await response.json();

    if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
      const reply = data.candidates[0].content.parts[0].text;
      
      // Guardar analíticas
      await prisma.interaction.create({
        data: { chatbotId: chatbot.id, query: message, response: reply }
      }).catch(e => console.error("Error analíticas:", e));

      return NextResponse.json({ reply });
    } else {
      return NextResponse.json({ reply: "⚠️ El servidor de Google tuvo un problema de redacción. Por favor, reintenta tu pregunta." });
    }

  } catch (error: any) {
    return NextResponse.json({ error: "Sincronizando... " + error.message }, { status: 500 });
  }
}