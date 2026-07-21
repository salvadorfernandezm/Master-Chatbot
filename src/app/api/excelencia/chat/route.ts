import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // 1. Extraemos la llave justo al momento de la llamada
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("ERROR: No se encontró la variable GEMINI_API_KEY en Vercel");
    return NextResponse.json({ text: "Error de configuración: Falta la llave API." }, { status: 500 });
  }

  try {
    const { message, history } = await req.json();
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Usamos el modelo más rápido y ligero para evitar timeouts
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "Eres Sócrates, mentor de la 'Iniciativa de Excelencia'. Tu misión es ayudar a alumnos a pulir propuestas académicas. REGLAS: 1. No aceptes quejas, solo propuestas proactivas. 2. Si piden cosas absurdas (gimnasios, albercas, puntos), cuestiónalos socráticamente. 3. Cuando la propuesta sea digna, termina con: [PROPUESTA_LISTA]." }],
        },
        ...history,
      ],
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });
  } catch (error: any) {
    // ESTO ES LO MÁS IMPORTANTE: Ver el error real en la consola de Vercel
    console.error("DETALLE DEL ERROR EN EL ÁGORA:", error.message);
    return NextResponse.json({ 
      text: "Sócrates está meditando (Error de conexión). Verifica tu API Key.",
      error: error.message 
    }, { status: 500 });
  }
}