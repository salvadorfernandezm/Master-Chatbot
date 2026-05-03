export const dynamic = 'force-dynamic';
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { prisma } from "@/lib/prisma";
import { searchVectorStore, loadStoreFromDB } from "@/lib/vectorStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, token } = body;
    const apiKey = process.env.GEMINI_API_KEY;

    // ESTO SALDRÁ EN TUS LOGS SI LOGRAS VERLOS
    console.log("--- INICIANDO RASTREO DE MODELO CON GASOLINA ---");

    if (!apiKey) return NextResponse.json({ reply: "Falta la llave en Vercel." });

    const chatbot = await prisma.chatbot.findUnique({ where: { token, isActive: true } });
    if (!chatbot) return NextResponse.json({ reply: "Chatbot no activo." });

    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 10);
    const contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n");

    const systemPrompt = `Eres un asistente. Contexto: ${contextText}`;

    // --- LA LISTA DE LOS MODELOS (Probaremos hasta que uno abra) ---
    const modelNames = [
        "gemini-1.5-flash",       // El caballo de batalla
        "gemini-1.5-flash-latest", // El alias de emergencia
        "gemini-2.0-flash-lite",   // El moderno ligero
        "gemini-pro"              // El clásico universal
    ];

    for (const name of modelNames) {
        console.log(`📡 Probando con: ${name}`);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${name}:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: systemPrompt + "\n\nUsuario: " + message }] }]
            })
        });

        const data = await response.json();

        // SI GOOGLE RESPONDE BIEN (OK), PARAMOS Y MANDAMOS LA RESPUESTA
        if (response.ok && data.candidates?.[0]?.content) {
            console.log(`✅ ¡ÉXITO CON EL MODELO ${name}!`);
            return NextResponse.json({ reply: data.candidates[0].content.parts[0].text });
        }
        
        console.warn(`❌ Falló ${name} por: ${data.error?.message}`);
    }

    return NextResponse.json({ reply: "🚫 Todos los modelos de Google están saturados en tu región ahora mismo. Por favor, reintenta en un par de minutos." });

  } catch (error: any) {
    return NextResponse.json({ reply: `❌ Error de sistema: ${error.message}` });
  }
}