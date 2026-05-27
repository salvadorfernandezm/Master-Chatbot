export const dynamic = 'force-dynamic';
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { prisma } from "@/lib/prisma";
import { searchVectorStore, loadStoreFromDB } from "@/lib/vectorStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, token } = body;
    const apiKeyGemini = process.env.GEMINI_API_KEY;
    const apiKeyOpenAI = process.env.OPENAI_API_KEY;

    // 1. IDENTIFICAR AL CHATBOT
    const chatbot = await prisma.chatbot.findUnique({
      where: { token, isActive: true },
      include: { knowledgeBase: true }
    });
    if (!chatbot) return NextResponse.json({ reply: "Chatbot no encontrado." });

    // 2. CARGAR CONTEXTO
    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const results = await searchVectorStore(message, chatbot.knowledgeBaseId, 15);
    const contextText = results.map((v: any) => v.pageContent).join("\n\n");

   const systemPrompt = `Eres el asistente académico del Profesor Salvador. 
USA ESTA BASE DE DATOS (El primer bloque siempre tiene los títulos de las actividades):
${contextText}

REGLAS DE ORO:
1. Al dar calificaciones, USA EL MARKDOWN (negritas y viñetas). 
2. Busca la "Fila 1" o el encabezado para identificar los NOMBRES REALES de cada actividad (ej: "Plenario Dignidad", "Moral Ética").
3. Presenta los resultados en una LISTA clara:
   - **Nombre de la Actividad**: [Nota Obtenida]
4. Calcula el promedio normalizando si detectas una escala distinta a 10.`;

    let finalReply = "";

    // --- MOTOR 1: GEMINI (GRATIS) ---
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKeyGemini}`;
      const resG = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt + "\n\nUsuario: " + message }] }] })
      });
      const dataG = await resG.json();
      if (resG.ok && dataG.candidates?.[0]?.content) {
        finalReply = dataG.candidates[0].content.parts[0].text;
      }
    } catch (e) { console.log("Google ocupado, saltando a OpenAI..."); }

    // --- MOTOR 2: OPENAI (RESPALDO DE PAGO) ---
    if (!finalReply && apiKeyOpenAI) {
      try {
        const resO = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKeyOpenAI}` },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: message }]
          })
        });
        const dataO = await resO.json();
        finalReply = dataO.choices?.[0]?.message?.content || "";
      } catch (e) { console.log("Fallo en motor de respaldo."); }
    }

    if (!finalReply) finalReply = "⚠️ El sistema de inteligencia artificial está muy saturado. Por favor, reintenta tu pregunta en 20 segundos.";

    // --- EL TAQUÍGRAFO (REGISTRO FINAL) ---
    try {
      await prisma.interaction.create({
        data: {
          chatbotId: chatbot.id,
          query: message.substring(0, 500),
          response: reply.substring(0, 2000)
        }
      });
      console.log("📊 Interacción grabada con éxito.");
    } catch (e) {
      console.error("❌ Error al grabar analítica:", e);
    }

    return NextResponse.json({ reply });