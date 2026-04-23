export const dynamic = 'force-dynamic';
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { prisma } from "@/lib/prisma";
import { searchVectorStore, loadStoreFromDB } from "@/lib/vectorStore";

// Función para esperar si la cuota se agota
const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

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

    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 25);
    const contextText = vectorContexts.map(v => v.pageContent).join("\n\n---\n\n");

    // LÓGICA DE SEGURIDAD POR CORREO
    const systemPrompt = `Eres "${chatbot.name}", asistente del Prof. Salvador.
    CONTEXTO: ${contextText}

    REGLA DE SEGURIDAD:
    - Para dar NOTAS o ASISTENCIAS, el usuario DEBE dar su correo.
    - Si no lo da, pídelo: "Para ver tus datos, dime tu correo institucional".
    - Si el correo está en el CONTEXTO (JSON o Tabla), dale su reporte completo:
      * Calificaciones.
      * Asistencias (cuenta cuántos 'absent' tiene).
    - NO INVENTES NADA.`;

    // Intentamos la llamada con reintento si hay saturación
    let attempts = 0;
    while (attempts < 2) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt + "\n\nUsuario: " + message }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 2000 }
        })
      });

      const data = await response.json();

      if (response.ok) {
        const reply = data.candidates[0].content.parts[0].text;
        // Guardar analíticas
        await prisma.interaction.create({
          data: { chatbotId: chatbot.id, query: message, response: reply }
        }).catch(() => {});
        return NextResponse.json({ reply });
      }

      if (data.error?.message.includes("quota") || response.status === 429) {
        console.log("Cuota agotada, esperando para reintentar...");
        await wait(10000); // Espera 10 segundos
        attempts++;
      } else {
        throw new Error(data.error?.message || "Error desconocido");
      }
    }

    return NextResponse.json({ error: "El servidor de Google está muy ocupado. Reintenta en 1 minuto." }, { status: 500 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}