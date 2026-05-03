export const dynamic = 'force-dynamic';
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { prisma } from "@/lib/prisma";
import { searchVectorStore, loadStoreFromDB } from "@/lib/vectorStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, token } = body;

    // --- AQUÍ SACAMOS LA LLAVE DEL CAJÓN (Lo que faltaba) ---
    const apiKey = process.env.GEMINI_API_KEY;

    console.log("-----------------------------------------!!!!!!!");
    console.log("🚀 EJECUTANDO VERSION ULTRA FINAL DE PRUEBA");
    console.log(`🔑 Probando llave con prefijo: ${apiKey?.substring(0, 7)}`);
    console.log("-----------------------------------------!!!!!!!");

    if (!apiKey) {
      return NextResponse.json({ reply: "❌ No hay GEMINI_API_KEY configurada en el panel de Vercel." });
    }

    const chatbot = await prisma.chatbot.findUnique({ where: { token, isActive: true } });
    if (!chatbot) return NextResponse.json({ reply: "❌ Chatbot no encontrado o inactivo." });

    // Cargar datos de Supabase
    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 12);
    const contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n---\n\n");

    const systemPrompt = `Eres un asistente. Contexto: ${contextText}`;

    // USAMOS EL MODELO QUE TU CUENTA SÍ TIENE
    const modelName = "gemini-2.0-flash-lite"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nUsuario: " + message }] }]
      })
    });

    const data = await response.json();

    if (response.ok) {
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No obtuve una respuesta clara.";
      return NextResponse.json({ reply });
    } else {
      // SI GOOGLE RECHAZA, MOSTRAMOS LA RAZÓN REAL
      const errorMsg = data.error?.message || "Error desconocido";
      const errorCode = data.error?.code || "S/N";
      return NextResponse.json({ reply: `🚫 GOOGLE DIJO: ${errorMsg} (Código: ${errorCode})` });
    }

  } catch (error: any) {
    return NextResponse.json({ reply: `❌ FALLO TÉCNICO EN SERVIDOR: ${error.message}` });
  }
}