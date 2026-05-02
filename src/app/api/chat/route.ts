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

    // 1. CARGA DE DATOS (Bajamos el número de fragmentos para no aturdir a la IA)
    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 10);
    const contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n---\n\n");

    // 2. INSTRUCCIONES ULTRA-SIMPLES
    const systemPrompt = `Eres el asistente académico del Profesor Salvador. 
    Usa solo este CONTEXTO:
    ${contextText}
    
    TAREA: Explica pedagógicamente la diferencia entre los conceptos preguntados. 
    REGLA: Si son notas, calcúlalas. Si es filosofía, explícala. Sé muy detallado.`;

    // 3. MODELO 2.0 (TU MODELO REAL)
    // Usamos el endpoint v1beta porque es el que permite los modelos de nueva generación
    const modelName = "gemini-2.0-flash"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    console.log(`📡 Llamando al cerebro 2.0 con la consulta: ${message}`);

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
            temperature: 0.2, 
            maxOutputTokens: 2000 // Permitimos respuestas largas
        }
      })
    });

    const data = await response.json();

    // 4. LECTURA PROTEGIDA DE LA RESPUESTA
    if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
      const reply = data.candidates[0].content.parts[0].text;
      
      // Guardar para analíticas
      await prisma.interaction.create({
        data: { chatbotId: chatbot.id, query: message, response: reply }
      }).catch(() => {});

      return NextResponse.json({ reply });
    } else {
      // SI LLEGAMOS AQUÍ, MOSTRAMOS EL ERROR DE GOOGLE REAL EN EL LOG
      console.error("Fallo de Google:", JSON.stringify(data));
      
      // Si la respuesta viene bloqueada por Google (Safety)
      if (data.promptFeedback?.blockReason) {
         return NextResponse.json({ reply: "⚠️ El motor de Google bloqueó esta consulta filosófica por seguridad. Intenta preguntar lo mismo pero omitiendo la palabra 'Doctor' o 'Xabier'." });
      }

      return NextResponse.json({ reply: "⚠️ Estamos ajustando el nivel de profundidad académica. Por favor, repite tu pregunta ahora mismo." });
    }

  } catch (error: any) {
    return NextResponse.json({ error: "Sincronizando sabiduría... " + error.message }, { status: 500 });
  }
}