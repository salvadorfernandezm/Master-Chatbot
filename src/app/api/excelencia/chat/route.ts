import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ text: "Falta la API KEY." }, { status: 500 });
  }

  try {
    const body = await req.json();
    const userMessage = body.message;
    const history = body.history || [];

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // USAMOS EL NOMBRE EXACTO QUE SALIÓ EN TU LISTA (sin el prefijo models/)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "Eres Sócrates, el mentor de la 'Iniciativa de Excelencia' de la Facultad. Tu misión: ayudar a los alumnos a pulir sus ideas para mejorar la vida académica. REGLAS: 1. No aceptes simples quejas, pide soluciones. 2. Si piden cosas superficiales (gimnasio, café, puntos gratis), cuestiónalos con elegancia: ¿Cómo ayuda eso al intelecto? 3. Si la idea es buena, ayúdalos a redactarla formalmente. 4. Cuando la propuesta sea digna de la Facultad, termina el mensaje con: [PROPUESTA_LISTA]." }],
        },
        ...history,
      ],
    });

    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });

  } catch (error: any) {
    console.error("ERROR EN EL ÁGORA:", error.message);
    return NextResponse.json({ 
      text: "Sócrates está en un profundo debate interno. Intenta de nuevo.",
      error: error.message 
    }, { status: 500 });
  }
}