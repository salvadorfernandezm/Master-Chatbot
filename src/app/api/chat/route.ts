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

    // 1. CARGAR CONTEXTO (Aquí ya debe estar tu .txt con el JSON de asistencias)
    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 30);
    const contextText = vectorContexts.map(v => v.pageContent).join("\n\n---\n\n");

    const systemPrompt = `Eres "${chatbot.name}", asistente del Prof. Salvador Fernández.
    
    CONTEXTO (JSON Y TABLAS):
    ${contextText}

    REGLAS:
    - Si el usuario pregunta por notas o faltas, EXIGE su correo.
    - Busca el correo en el JSON. Si dice "status: present" es asistencia, "absent" es falta.
    - Suma las faltas ('absent') y dalas con las calificaciones.
    - Responde siempre de forma completa. No cortes la respuesta.`;

    // 2. CONEXIÓN POR V1 (ESTABLE) - AQUÍ ESTÁ LA MAGIA PARA LOS 1,500 MENSAJES
    // Usamos el modelo 1.5 Flash en la oficina V1, saltando la V1BETA
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    console.log("📡 Saltando al modelo de producción 1.5 para recuperar cuota...");

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nUsuario: " + message }] }],
        generationConfig: { 
            temperature: 0.2, 
            maxOutputTokens: 2500 // Para que no se corte
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
        // Si la V1 falla con 404, es que tu cuenta REALMENTE solo tiene el futuro.
        // En ese caso, probaremos el 1.5-flash-8b que es ultra-ligero y suele estar libre.
        console.warn("V1 falló, intentando modelo alternativo 8b...");
        const altUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent?key=${apiKey}`;
        const altRes = await fetch(altUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt + message }] }] })
        });
        const altData = await altRes.json();
        return NextResponse.json({ reply: altData.candidates[0].content.parts[0].text });
    }

    const reply = data.candidates[0].content.parts[0].text;

    // Guardar para analíticas
    await prisma.interaction.create({
      data: { chatbotId: chatbot.id, query: message, response: reply }
    }).catch(() => {});

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("❌ FALLO FINAL:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}