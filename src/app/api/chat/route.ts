export const dynamic = 'force-dynamic';
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { prisma } from "@/lib/prisma";
import { searchVectorStore, loadStoreFromDB } from "@/lib/vectorStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, token } = body;
    
    const apiKeyGemini = process.env.GEMINI_API_KEY;
    const apiKeyOpenAI = process.env.OPENAI_API_KEY;

    // 1. IDENTIFICAR CHATBOT Y CARGAR CONTEXTO
    const chatbot = await prisma.chatbot.findUnique({
      where: { token, isActive: true }
    });
    if (!chatbot) return NextResponse.json({ error: "Chatbot no encontrado" }, { status: 404 });

    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 15);
    const contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n");

    const systemPrompt = `Eres el asistente oficial del Prof. Salvador. Usa este contexto para responder: ${contextText}. Si es sobre notas, busca al alumno y calcula su promedio ponderado.`;

    // --- INTENTO 1: GOOGLE GEMINI (El motor gratuito) ---
    console.log("📡 Intentando con Gemini...");
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKeyGemini}`;
    
    let response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nUsuario: " + message }] }]
      })
    });

    let data = await response.json();

    // --- RESPALDO: OPENAI (Si Gemini está saturado o da error) ---
    if (!response.ok || (data.error && (data.error.code === 429 || data.error.message.includes("quota")))) {
      console.log("⚠️ Gemini saturado o no disponible. Activando respaldo OpenAI (GPT-4o-mini)...");
      
      if (!apiKeyOpenAI) {
        throw new Error("Gemini saturado y no hay OPENAI_API_KEY configurada.");
      }

      const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKeyOpenAI}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini", // El más rápido y barato
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message }
          ],
          temperature: 0.2
        })
      });

      const openaiData = await openaiRes.json();
      
      if (!openaiRes.ok) {
        throw new Error(openaiData.error?.message || "Ambos motores fallaron.");
      }

      const reply = openaiData.choices[0].message.content;
      return NextResponse.json({ reply });
    }

    // Si Gemini funcionó bien a la primera
    const reply = data.candidates[0].content.parts[0].text;

    // Guardar en analíticas
    await prisma.interaction.create({
      data: { chatbotId: chatbot.id, query: message.substring(0, 500), response: reply.substring(0, 2000) }
    }).catch(e => console.error("Error analíticas:", e));

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("❌ FALLO TOTAL:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}