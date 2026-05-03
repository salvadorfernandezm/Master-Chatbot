export const dynamic = 'force-dynamic';
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { prisma } from "@/lib/prisma";
import { searchVectorStore, loadStoreFromDB } from "@/lib/vectorStore";

// Función mágica para que el código espere unos segundos solo
const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, token } = body;
    
    // USAMOS AMBAS LLAVES PARA EL DOBLE DE GASOLINA
    const apiKeys = [process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_2].filter(Boolean);
    
    if (apiKeys.length === 0) return NextResponse.json({ error: "No hay llaves configuradas" }, { status: 500 });

    const chatbot = await prisma.chatbot.findUnique({
      where: { token, isActive: true },
      include: { knowledgeBase: true }
    });
    if (!chatbot) return NextResponse.json({ error: "Chatbot inactivo" }, { status: 404 });

    // CARGAMOS CONTEXTO (RAG)
    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 12);
    const contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n---\n\n");

    const systemPrompt = `Eres el asistente oficial del Prof. Salvador. Usa este CONTEXTO:
    ${contextText}
    REGLA: Busca el nombre o correo del alumno. No inventes asistencias. Sé directo y pedagógico.`;

    // --- EL CICLO DEL GUERRERO (Prueba cada llave con cada modelo) ---
    const modelsToTry = ["gemini-1.5-flash", "gemini-2.0-flash-lite"];
    
    for (const key of apiKeys) {
        for (const model of modelsToTry) {
            console.log(`📡 Intentando con llave ${key.substring(0,6)}... y modelo ${model}`);
            
            // Usamos la oficina v1 que es la de producción masiva
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
                    
                    // Guardar para las gráficas que tanto nos costaron
                    await prisma.interaction.create({
                        data: { chatbotId: chatbot.id, query: message.substring(0, 500), response: reply.substring(0, 2000) }
                    }).catch(() => {});
                    
                    return NextResponse.json({ reply });
                }
            } catch (e) {
                console.warn(`Error con ${model}:`, e.message);
            }
        }
    }

    // Si llegamos aquí, es que Google está realmente saturado hoy
    throw new Error("Alta demanda de Google detectada");

  } catch (error: any) {
    return NextResponse.json({ error: "Google está procesando mucha información. Por favor, reintenta en 15 segundos." }, { status: 500 });
  }
}