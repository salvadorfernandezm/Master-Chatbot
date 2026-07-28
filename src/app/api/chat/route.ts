export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchVectorStore, loadStoreFromDB } from "@/lib/vectorStore";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, token } = body;

    const chatbot = await prisma.chatbot.findUnique({
      where: { token, isActive: true },
      include: { knowledgeBase: true }
    });

    if (!chatbot) return NextResponse.json({ reply: "Asistente no disponible." });

    let contextText = "";
    if (chatbot.knowledgeBaseId) {
      try {
        await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
        // Buscamos 40 fragmentos pero con una lógica de 're-intento'
        const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 40);
        contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n");
      } catch (e) { console.error("Error en vectores:", e); }
    }

    const systemPrompt = `
      Eres "${chatbot.name}". Tu misión es informar con amabilidad y precisión.
      
      CONOCIMIENTO BASE (Tu identidad y datos maestros):
      ${chatbot.systemInstructions}
      
      DETALLES EXTRAÍDOS DE ARCHIVOS (Usa esto para profundizar en planes de estudio y requisitos):
      ${contextText || "No se encontraron detalles adicionales en los documentos para esta consulta específica."}
      
      REGLAS DE ORO:
      1. Si el usuario pregunta por la oferta académica, usa primero tu 'CONOCIMIENTO BASE'. Ahí están los nombres de las maestrías reales.
      2. Usa los 'DETALLES EXTRAÍDOS' para explicar materias, semestres o requisitos de esos programas.
      3. NUNCA inventes programas que no estén en ninguna de las dos secciones anteriores.
      4. Si el usuario pregunta por algo que no está en ninguna sección, invita cordialmente a contactar a la oficina: 8271285 ext 3556.
      5. Responde siempre de forma humana, sin mencionar 'archivos' o 'contextos'.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: 0.2, // Un poco más de fluidez pero manteniendo el rigor.
    });

    const reply = response.choices[0].message.content || "Lo siento, no pude procesar la respuesta.";

    prisma.interaction.create({
      data: { chatbotId: chatbot.id, query: message.substring(0, 500), response: reply.substring(0, 2000) }
    }).catch(e => console.error("Error analíticas:", e));

    return NextResponse.json({ reply });

  } catch (error: any) {
    return NextResponse.json({ reply: "Conexión interrumpida con el Ágora." });
  }
}