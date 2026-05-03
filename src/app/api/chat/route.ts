export const dynamic = 'force-dynamic';
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { prisma } from "@/lib/prisma";
import { searchVectorStore, loadStoreFromDB } from "@/lib/vectorStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, token } = body;
    
    // Filtramos las llaves para asegurar que solo queden las que tienen texto
    const apiKeys = [process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_2].filter((k): k is string => !!k);
    
    if (apiKeys.length === 0) return NextResponse.json({ error: "Faltan llaves" }, { status: 500 });

    const chatbot = await prisma.chatbot.findUnique({
      where: { token, isActive: true },
      include: { knowledgeBase: true }
    });
    if (!chatbot) return NextResponse.json({ error: "Chatbot inactivo" }, { status: 404 });

    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 15);
    const contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n---\n\n");

    const systemPrompt = `Eres el asistente oficial del Prof. Salvador. Usa este CONTEXTO:
    ${contextText}
    REGLA: Busca el registro exacto. No inventes datos.`;

    const modelsToTry = ["gemini-1.5-flash", "gemini-2.0-flash-lite"];
    
    // --- EL CICLO DEL GUERRERO REFORZADO ---
    for (const key of apiKeys) {
        for (const model of modelsToTry) {
            // Ponemos una protección extra para que TypeScript no proteste
            if (!key) continue;

            console.log(`📡 Probando modelo ${model} con llave.`);
            const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${key}`;
            
            try {
                const response = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: systemPrompt + "\n\nPregunta: " + message }] }],
                        generationConfig: { temperature: 0.1, maxOutputTokens: 2000 }
                    })
                });

                const data = await response.json();

                if (response.ok && data.candidates?.[0]?.content) {
                    const reply = data.candidates[0].content.parts[0].text;
                    
                    await prisma.interaction.create({
                        data: { chatbotId: chatbot.id, query: message.substring(0, 500), response: reply.substring(0, 2000) }
                    }).catch(() => {});
                    
                    return NextResponse.json({ reply });
                }
            } catch (e) {
                console.error("Error en intento:", e);
            }
        }
    }

    return NextResponse.json({ reply: "⚠️ El sistema de Google está muy saturado hoy. Por favor, intenta de nuevo en 30 segundos." });

  } catch (error: any) {
    return NextResponse.json({ error: "Reintentando... " + error.message }, { status: 500 });
  }
}