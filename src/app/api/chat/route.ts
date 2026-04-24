export const dynamic = 'force-dynamic';
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { prisma } from "@/lib/prisma";
import { searchVectorStore, loadStoreFromDB } from "@/lib/vectorStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, token } = body;
    const apiKey = process.env.GEMINI_API_KEY;

    // --- IDENTIFICAR CHATBOT ---
    const chatbot = await prisma.chatbot.findUnique({
      where: { token, isActive: true }
    });
    if (!chatbot) return NextResponse.json({ error: "Chatbot no encontrado" }, { status: 404 });

    // --- CARGAR CONTEXTO (MÁXIMA VELOCIDAD) ---
    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 10);
    const contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n");

    // --- LOG PARA EL MAESTRO ---
    console.log(`🔎 Buscando para: ${message}. Chunks: ${vectorContexts.length}`);

    // --- LLAMADA A GOOGLE (VERSIÓN 2.5 FLASH) ---
    // Usamos el nombre que tu terminal confirmó como activo
    const modelName = "gemini-2.5-flash"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `CONTEXTO ACADÉMICO:\n${contextText}\n\nPREGUNTA: ${message}\n\nINSTRUCCIÓN: Responde basado solo en el contexto.` }]
        }],
        // APAGAMOS LOS FILTROS PARA QUE NO BLOQUEE CORREOS
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1000 }
      })
    });

    const data = await response.json();

    // --- EL MOMENTO DE LA VERDAD (LOGS) ---
    if (!response.ok) {
        console.error("❌ ERROR DE GOOGLE:", JSON.stringify(data));
        return NextResponse.json({ reply: `Google dice: ${data.error?.message || "Error desconocido"}` });
    }

    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        const reply = data.candidates[0].content.parts[0].text;
        return NextResponse.json({ reply });
    } else {
        // Esto pasa si Google bloquea la respuesta por seguridad
        console.warn("⚠️ RESPUESTA VACÍA. POSIBLE BLOQUEO DE SEGURIDAD:", JSON.stringify(data));
        return NextResponse.json({ reply: "Google recibió la pregunta pero no pudo responder por sus políticas de seguridad. Intenta sin usar nombres propios o correos." });
    }

  } catch (error: any) {
    console.error("❌ FALLO TÉCNICO:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}