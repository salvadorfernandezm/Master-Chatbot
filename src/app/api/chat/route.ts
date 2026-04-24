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

    // 1. CARGAR CONTEXTO
    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 25);
    const contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n");

    const systemPrompt = `Eres el asistente académico del Prof. Salvador.
    Usa estos datos: ${contextText}.
    CÁLCULO: Si una nota es sobre 12, divídela entre 1.2. Si es sobre 5, multiplícala por 2.
    INSTRUCCIÓN: Responde directo y amable.`;

    // 2. EL MODELO QUE SÍ EXISTE EN TU CUENTA (2.0 FLASH)
    // Usamos el endpoint v1 (Producción) con el nombre exacto
    const modelName = "gemini-2.0-flash"; 
    const url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`;

    console.log(`🚀 Conectando a Producción con el modelo: ${modelName}`);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nPregunta: " + message }] }],
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ],
        generationConfig: { temperature: 0.1, maxOutputTokens: 2000 }
      })
    });

    const data = await response.json();

    if (!response.ok) {
        // Si el modelo 2.0 da error de cuota, probamos el alias universal 'gemini-flash-latest'
        console.warn("Intentando con el alias 'latest' por saturación...");
        const backupUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
        const backupRes = await fetch(backupUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt + message }] }] })
        });
        const backupData = await backupRes.json();
        
        if (!backupRes.ok) {
            throw new Error(backupData.error?.message || "Google está saturado");
        }
        return NextResponse.json({ reply: backupData.candidates[0].content.parts[0].text });
    }

    const reply = data.candidates[0].content.parts[0].text;
    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("❌ FALLO:", error.message);
    return NextResponse.json({ error: "Nota: " + error.message }, { status: 500 });
  }
}