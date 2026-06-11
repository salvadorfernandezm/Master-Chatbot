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

    // 1. CARGAR CONTEXTO (40 fragmentos para máxima precisión)
    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 40);
    const contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n");

    // 2. DETECTAR TIPO DE CHAT PARA EL PROMPT
    const isGrades = chatbot.name.toLowerCase().includes("calificaci") || chatbot.name.toLowerCase().includes("ética");
    const isAPA = chatbot.name.toLowerCase().includes("apa");

    let specificInstructions = "";
    if (isGrades) {
      specificInstructions = "REGLA DE PROMEDIO: Si una nota es sobre 12, divídela entre 1.2. Si es sobre 5, multiplícala por 2. Muestra el desglose.";
    } else if (isAPA) {
      specificInstructions = "Eres experto en APA 7. Cita páginas y usa ejemplos del contexto. Si no está la regla, di que no se encuentra en el manual.";
    }

    const systemPrompt = `Eres "${chatbot.name}", el asistente del Prof. Salvador. 
    ${specificInstructions}
    Usa este contexto: ${contextText}. 
    Instrucciones adicionales del admin: ${chatbot.systemInstructions || ""}`;

    // 3. LLAMADA A GOOGLE
    const modelName = "gemini-flash-latest"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nPregunta: " + message }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 4000 }
      })
    });

    const data = await response.json();
    const reply = data.candidates[0].content.parts[0].text;

    // 4. GUARDAR ANALÍTICAS
    try {
      await prisma.interaction.create({
        data: { chatbotId: chatbot.id, query: message.substring(0, 500), response: reply.substring(0, 2000) }
      });
    } catch (e) { console.error("Error analíticas:", e); }

    return NextResponse.json({ reply });

  } catch (error: any) {
    return NextResponse.json({ error: "Reintentando..." }, { status: 500 });
  }
}