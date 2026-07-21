import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ text: "Error: No hay llave API." }, { status: 500 });
  }

  try {
    const { message, history } = await req.json();
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // CAMBIO CLAVE: Usamos 'gemini-pro' que es el más compatible y estable
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "Eres Sócrates, mentor de la 'Iniciativa de Excelencia'. Tu misión: ayudar a alumnos a pulir propuestas académicas. REGLAS: 1. No aceptes quejas, solo propuestas proactivas. 2. Si piden cosas absurdas (gimnasios, albercas, Starbucks), cuestiónalos socráticamente: ¿Cómo beneficia esto al intelecto y al estudio? 3. Cuando la propuesta sea digna y formal, termina el mensaje con la clave: [PROPUESTA_LISTA]." }],
        },
        ...history,
      ],
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("ERROR EN EL ÁGORA:", error.message);
    return NextResponse.json({ 
      text: "Sócrates está meditando profundamente. Intenta de nuevo.",
      details: error.message 
    }, { status: 500 });
  }
}