export const dynamic = 'force-dynamic';
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { prisma } from "@/lib/prisma";
import { searchVectorStore, loadStoreFromDB } from "@/lib/vectorStore";

// Función mágica para esperar
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, token } = body;
    const apiKey = process.env.GEMINI_API_KEY;

    const chatbot = await prisma.chatbot.findUnique({ where: { token, isActive: true } });
    if (!chatbot) return NextResponse.json({ error: "No hay chatbot" }, { status: 404 });
    
    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 15);
    const contextText = vectorContexts.map(v => v.pageContent).join("\n\n---\n\n");

    // --- PROBAMOS EL MODELO CON MEJOR CUOTA ---
    // Según tu lista, el 2.5-flash-lite es el candidato a ser el más "plebeyo" y generoso
    const modelName = "gemini-2.5-flash-lite"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    let reply = "";
    let success = false;
    let attempts = 0;

    console.log(`📡 Intentando conectar con ${modelName}...`);

    while (!success && attempts < 3) {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `CONTEXTO: ${contextText}\n\nPREGUNTA: ${message}` }] }]
        })
      });

      const data = await response.json();

      if (response.ok) {
        reply = data.candidates[0].content.parts[0].text;
        success = true;
      } else {
        attempts++;
        const errorMsg = data.error?.message || "";
        if (errorMsg.includes("quota") || response.status === 429) {
          console.log(`⏳ Cuota justa. Esperando 10 segundos para reintentar (Intento ${attempts})...`);
          await delay(10000); // Esperamos 10 segundos exactos
        } else {
          // Si el error es un 404, probamos el modelo Gemini 3 que ayer sí funcionó
          console.log("🔄 Cambiando a modelo Gemini 3 por seguridad...");
          const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
          const fallbackRes = await fetch(fallbackUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: message }] }] })
          });
          const fallbackData = await fallbackRes.json();
          if (fallbackRes.ok) {
            reply = fallbackData.candidates[0].content.parts[0].text;
            success = true;
          } else {
            throw new Error("Google está saturado. Reintenta en un minuto.");
          }
        }
      }
    }

    return NextResponse.json({ reply });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}