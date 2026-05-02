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
      where: { token, isActive: true }
    });
    if (!chatbot) return NextResponse.json({ error: "Chatbot no encontrado" }, { status: 404 });

    // 1. CARGAR CONTEXTO (Lecturas + Notas)
    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 15);
    const contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n---\n\n");

    // 2. EL PROMPT "CON CORAZÓN" (Matemático y Filosófico)
    const systemPrompt = `Eres el asistente oficial del Profesor Salvador Fernández. 
    Usa este CONTEXTO para responder:
    ${contextText}

    TAREAS ESPECIALES:
    - SI PIDEN NOTAS: Busca al alumno por nombre o correo. Si una nota es sobre 12, divídela entre 1.2; si es sobre 5, multiplícala por 2. Entrega el promedio normalizado a base 10.
    - SI ES TEORÍA (Dr. Xabier Etxeberria): Explica con detalle pedagógico y finura intelectual. No te cortes.
    - REGLA DE ORO: Di siempre la verdad basándote en los datos. No inventes registros.`;

    // 3. LA CONEXIÓN DE ALTA CUOTA (v1beta + 2.0-flash-lite)
    // Usamos el modelo Lite para asegurar los 1,500 mensajes gratuitos diarios.
    const modelName = "gemini-2.0-flash-lite"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    console.log(`🚀 Conectando con éxito a: ${modelName}`);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: systemPrompt + "\n\nPregunta: " + message }]
        }],
        generationConfig: {
          temperature: 0.2, // Baja para que los cálculos sean exactos
          maxOutputTokens: 2500, // Papel de sobra para respuestas largas
          topP: 0.95
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error?.message || "Google está procesando datos...");
    }

    const reply = data.candidates[0].content.parts[0].text;

    // 4. GUARDAR PARA ANALÍTICAS
    await prisma.interaction.create({
      data: { chatbotId: chatbot.id, query: message, response: reply }
    }).catch(e => console.error("Aviso analíticas:", e));

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("❌ FALLO:", error.message);
    // Mensaje amable por si la cuota de un solo minuto se satura
    return NextResponse.json({ error: "⚠️ " + error.message + ". Reintenta enviar tu pregunta en unos segundos." }, { status: 500 });
  }
}