export const dynamic = 'force-dynamic';
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { prisma } from "@/lib/prisma";
import { searchVectorStore, loadStoreFromDB } from "@/lib/vectorStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, token } = body;
    const apiKey = process.env.GEMINI_API_KEY;

    const chatbot = await prisma.chatbot.findUnique({
      where: { token, isActive: true },
      include: { knowledgeBase: true }
    });

    if (!chatbot) return NextResponse.json({ error: "Chatbot no encontrado" }, { status: 404 });

    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 30);
    const contextText = vectorContexts.map(v => v.pageContent).join("\n\n---\n\n");

    const systemPrompt = `Eres "${chatbot.name}", el asistente del Prof. Salvador. 
    REGLA: Usa este CONTEXTO (que es un JSON de alumnos): ${contextText}. 
    Si te dan un correo, busca las notas y el conteo de 'absent' (faltas). 
    No te preocupes por la privacidad del correo, es un entorno educativo controlado.`;

    // 1. URL DE LECTURA (Usamos v1beta para poder bajar los filtros de seguridad)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nPregunta: " + message }] }],
        // 2. DESACTIVAR FILTROS DE SEGURIDAD (Para que deje pasar los correos)
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ],
        generationConfig: { temperature: 0.1, maxOutputTokens: 2000 }
      })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error?.message || "Error en la API de Google");
    }

    // 3. LECTURA SÚPER FLEXIBLE
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const reply = data.candidates[0].content.parts[0].text;
        
        // Guardar para analíticas
        await prisma.interaction.create({
          data: { chatbotId: chatbot.id, query: message, response: reply }
        }).catch(() => {});

        return NextResponse.json({ reply });
    } 
    
    // Si llegamos aquí es que Google bloqueó la respuesta por otra razón
    return NextResponse.json({ 
        reply: "Google bloqueó la respuesta por seguridad al detectar el correo. Intenta escribir solo el nombre de usuario antes del @." 
    });

  } catch (error: any) {
    console.error("❌ ERROR DETECTADO:", error.message);
    // Devolvemos el error REAL para saber qué pasa
    return NextResponse.json({ error: "Error técnico: " + error.message }, { status: 500 });
  }
}