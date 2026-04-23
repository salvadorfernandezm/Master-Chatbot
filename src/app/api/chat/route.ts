export const dynamic = 'force-dynamic';
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { prisma } from "@/lib/prisma";
import { searchVectorStore, loadStoreFromDB } from "@/lib/vectorStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, token } = body;
    const apiKey = process.env.GEMINI_API_KEY;

    const chatbot = await prisma.chatbot.findUnique({
      where: { token, isActive: true },
      include: { knowledgeBase: true }
    });

    if (!chatbot) return NextResponse.json({ error: "Chatbot no encontrado" }, { status: 404 });

    // 1. CARGAR CONTEXTO
    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 25);
    const contextText = vectorContexts.map(v => v.pageContent).join("\n\n---\n\n");

    const systemPrompt = `Eres "${chatbot.name}", el asistente del Prof. Salvador Fernández. 
    INSTRUCCIÓN: Usa este contexto para responder: ${contextText}. 
    Si preguntan por notas o faltas, busca el correo en el JSON del contexto. 
    'absent' significa falta. Da resultados exactos.`;

    // 2. LLAMADA A GOOGLE (Oficina V1 - 1,500 Mensajes)
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nPregunta: " + message }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 2000 }
      })
    });

    const data = await response.json();

    // --- MEJORA DE LECTURA (Aquí evitamos el error 'undefined 0') ---
    let reply = "";
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        reply = data.candidates[0].content.parts[0].text;
    } else if (data.error) {
        throw new Error(data.error.message);
    } else {
        // Si Google bloqueó la respuesta por ver un correo (filtro de seguridad)
        reply = "Lo siento, por políticas de seguridad de la API no puedo procesar esa información directamente. Por favor, intenta preguntarme por tus resultados sin incluir el correo en la misma frase, o verifica que el archivo de datos esté bien cargado.";
    }

    // 3. GUARDAR ANALÍTICAS
    await prisma.interaction.create({
      data: { chatbotId: chatbot.id, query: message, response: reply }
    }).catch(() => {});

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("❌ ERROR:", error.message);
    return NextResponse.json({ error: "Hubo un pequeño error al procesar los datos. Por favor, reintenta." }, { status: 500 });
  }
}