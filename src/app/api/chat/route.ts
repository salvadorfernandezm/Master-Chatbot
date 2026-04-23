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

    const chatbot = await prisma.chatbot.findUnique({
      where: { token, isActive: true },
      include: { knowledgeBase: true }
    });

    if (!chatbot) return NextResponse.json({ error: "Chatbot no encontrado" }, { status: 404 });

    // 1. CARGAR CONTEXTO (Buscando a Alondra en el JSON)
    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 30);
    const contextText = vectorContexts.map(v => v.pageContent).join("\n\n---\n\n");

    const systemPrompt = `Eres "${chatbot.name}", el asistente del Prof. Salvador.
    INSTRUCCIÓN: Si el usuario da un correo, busca sus notas y faltas en este CONTEXTO:
    ${contextText}
    REGLA: Di la verdad, no inventes. Si el correo no está, pide que lo verifiquen.`;

    // 2. CADENA DE SUPERVIVENCIA (INTENTAREMOS 3 MODELOS)
    // El 2.0-flash-lite y el 1.5-flash-8b suelen tener cuota de 1,500 mensajes
    const modelsToTry = [
      "gemini-2.0-flash-lite", 
      "gemini-1.5-flash-8b",
      "gemini-2.0-flash"
    ];

    let lastError = "";
    
    for (const modelName of modelsToTry) {
      console.log(`📡 Intentando con modelo: ${modelName}...`);
      
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

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

        if (response.ok) {
          const reply = data.candidates[0].content.parts[0].text;
          
          // GUARDAR ANALÍTICAS (Esto ya sabemos que funciona)
          await prisma.interaction.create({
            data: { chatbotId: chatbot.id, query: message, response: reply }
          }).catch(() => {});

          return NextResponse.json({ reply });
        } else {
          console.warn(`⚠️ Modelo ${modelName} falló: ${data.error?.message}`);
          lastError = data.error?.message;
          // Si el error es de cuota o no encontrado, el bucle sigue al siguiente modelo
        }
      } catch (e: any) {
        lastError = e.message;
      }
    }

    // Si llegamos aquí, es que los 3 modelos fallaron
    return NextResponse.json({ 
      error: `Google está limitando el acceso temporalmente. Detalle: ${lastError}. Por favor, intenta de nuevo en un momento.` 
    }, { status: 500 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}