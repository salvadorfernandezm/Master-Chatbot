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

    // 1. IDENTIFICAR CHATBOT
    const chatbot = await prisma.chatbot.findUnique({
      where: { token, isActive: true },
      include: { knowledgeBase: true }
    });

    if (!chatbot) return NextResponse.json({ error: "Chatbot no encontrado" }, { status: 404 });

    // 2. BUSCAR CONTEXTO (RAG)
    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 25);
    const contextText = vectorContexts.map(v => v.pageContent).join("\n\n---\n\n");

    // 3. INSTRUCCIONES DE IDENTIDAD Y SEGURIDAD (Correo ElectrónICO)
    const isGradesChat = chatbot.name.toLowerCase().includes("calificaci") || chatbot.name.toLowerCase().includes("nota");
    
    let securityPrompt = "";
    if (isGradesChat) {
      securityPrompt = `
      REGLA DE SEGURIDAD OBLIGATORIA:
      - Solo puedes dar información si el usuario proporciona un CORREO ELECTRÓNICO.
      - Si el usuario NO ha dado un correo en su mensaje actual, pídelo amablemente: "Por favor, para proteger tu privacidad, proporcióname tu correo (el que usas en la app de asistencias)".
      - Busca en el contexto la columna 'Correo' o 'Email'. Si el correo no coincide exactamente, di que no encuentras el registro.
      - NUNCA des notas basándote solo en nombres propios.`;
    }

    const systemPrompt = `Eres "${chatbot.name}", el asistente académico del Profesor Salvador. 
    ${securityPrompt}
    
    CONTEXTO DE TUS ARCHIVOS:
    ${contextText || "No hay documentos cargados."}

    INSTRUCCIONES ADICIONALES: ${chatbot.systemInstructions || "Responde con profesionalismo."}
    
    REGLA DE SALIDA: No te cortes a mitad de frase. Sé detallado pero conciso.`;

    // 4. CONEXIÓN ESTABLE (Para recuperar los 1,500 mensajes)
    // Intentaremos usar la ruta 'v1' que es la de producción masiva
    const modelName = "gemini-1.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`;

    console.log(`📡 Conectando a Producción (1,500 msgs): ${modelName}`);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nPregunta: " + message }] }],
        generationConfig: { 
          temperature: 0.7, 
          maxOutputTokens: 2500, // Micrófono abierto al máximo
          topP: 0.95
        }
      })
    });

    const data = await response.json();
    
    // Si la oficina 'v1' nos da 404 (porque tu cuenta es VIP), saltamos automáticamente al 2.0 lite
    if (!response.ok && response.status === 404) {
      console.log("⚠️ Producción v1 no disponible, usando Gemini 2.0 Flash Lite...");
      const backupUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`;
      const backupRes = await fetch(backupUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt + "\n\nPregunta: " + message }] }],
          generationConfig: { maxOutputTokens: 2500 }
        })
      });
      const backupData = await backupRes.json();
      const reply = backupData.candidates[0].content.parts[0].text;
      return NextResponse.json({ reply });
    }

    if (!response.ok) throw new Error(data.error?.message || "Fallo en Google");

    const reply = data.candidates[0].content.parts[0].text;

    // 5. GUARDAR ANALÍTICAS
    await prisma.interaction.create({
      data: { chatbotId: chatbot.id, query: message, response: reply }
    }).catch(e => console.error("Error analíticas:", e));

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("❌ FALLO:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}