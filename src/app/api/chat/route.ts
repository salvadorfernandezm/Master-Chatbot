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
    });
    if (!chatbot) return NextResponse.json({ error: "Chatbot no encontrado" }, { status: 404 });

    // CARGAR CONTEXTO
    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 15);
    const contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n---\n\n");

    const systemPrompt = `Eres un asistente académico. Usa este contexto: ${contextText}. Responde directo y pedagógico.`;

    // --- EL BUSCADOR DE MODELOS (PLAN DE RESCATE FINAL) ---
    // Probaremos estos nombres que salieron en tu terminal, 
    // en orden de los que más probabilidad tienen de tener cuota abierta.
    const modelsToTry = [
      "gemini-2.0-flash-lite", 
      "gemini-1.5-flash-8b", // El modelo "ligero" con más cuota
      "gemini-flash-latest",  // El alias universal
      "gemini-2.5-flash-lite"
    ];

    let reply = "";
    let success = false;
    let lastError = "";

    for (const name of modelsToTry) {
        if (success) break;
        console.log(`📡 Probando "Llave" en el modelo: ${name}...`);
        
        // Volvemos a v1beta porque v1 te da 404
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${name}:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: systemPrompt + "\n\nPregunta: " + message }] }]
                })
            });

            const data = await response.json();

            if (response.ok && data.candidates?.[0]?.content) {
                reply = data.candidates[0].content.parts[0].text;
                console.log(`✅ ¡ÉXITO! Google respondió con el modelo: ${name}`);
                success = true;
            } else {
                lastError = data.error?.message || "Sin respuesta";
                console.warn(`❌ El modelo ${name} dijo: ${lastError}`);
            }
        } catch (err: any) {
            console.warn(`⚠️ Error conectando a ${name}: ${err.message}`);
        }
    }

    if (!success) {
        throw new Error(`Google está limitando el acceso hoy. (Último reporte: ${lastError})`);
    }

    // Guardamos analíticas del éxito
    await prisma.interaction.create({
      data: { chatbotId: chatbot.id, query: message.substring(0,500), response: reply.substring(0,2000) }
    }).catch(e => console.error("Error analíticas:", e));

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("❌ FALLO TOTAL:", error.message);
    // Mensaje amable para tus colegas si todo Google falla
    return NextResponse.json({ error: "Saturación temporal de Google. Reintenta tu pregunta en 15 segundos." }, { status: 500 });
  }
}