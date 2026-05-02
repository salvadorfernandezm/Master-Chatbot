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
      where: { token, isActive: true }
    });
    if (!chatbot) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    // CARGAMOS TODO LO QUE TENEMOS EN SUPABASE
    await loadStoreFromDB(chatbot.knowledgeBaseId, prisma);
    const vectorContexts = await searchVectorStore(message, chatbot.knowledgeBaseId, 50); // Le mandamos 50 pedazos para estar seguros
    const contextText = vectorContexts.map((v: any) => v.pageContent).join("\n\n---\n\n");

    const systemPrompt = `Eres el asistente oficial del Profesor Salvador Fernández Martínez. 
    TU ÚNICA MISIÓN es buscar a los alumnos y darles sus notas basándote en los datos.

    INSTRUCCIONES CRÍTICAS:
    1. FUENTE DE DATOS: Tienes acceso a fragmentos del manual APA y listas de calificaciones. 
    2. CALIFICACIONES: Si el usuario dice "Soy [Nombre]", busca la línea donde aparece ese nombre.
       - Usa estos nombres reales de actividades: Act. 1 Plenario Dignidad, Act. 2 Conferencia, Act. 4 Código, Act. 5 Moral ética meta (esta es sobre 12 y se divide entre 1.2), Act 6 Examen 1.
    3. REGLA DE ORO: Si ves números junto a un nombre en el texto de abajo, ¡USALOS! No digas que no tienes acceso.
    
    DATOS DEL SISTEMA:
    ${contextText}`;

    const modelName = "gemini-flash-latest"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nUsuario: " + message }] }],
        generationConfig: { 
          temperature: 0.1, // Un toque de inteligencia para no ser tan rígido
          maxOutputTokens: 2000 
        }
      })
    });

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Registro localizado pero sigo analizando. ¿Puedes repetir solo tu apellido?";

    return NextResponse.json({ reply });

  } catch (error: any) {
    return NextResponse.json({ error: "Sincronizando: " + error.message }, { status: 500 });
  }
}