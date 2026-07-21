import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ text: "Falta la API KEY en Vercel." }, { status: 500 });
  }

  try {
    const body = await req.json();
    const userMessage = body.message;
    const history = body.history || [];

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Probamos con el nombre estándar. Si este falla, el log nos dirá por qué.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "Eres Sócrates, mentor de la 'Iniciativa de Excelencia'. Tu misión es ayudar a alumnos a pulir propuestas académicas sólidas. REGLAS: 1. No aceptes quejas. 2. Si piden cosas absurdas, cuestiónalos. 3. Cuando la propuesta sea digna, termina con la clave exacta: [PROPUESTA_LISTA]." }],
        },
        ...history,
      ],
    });

    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    return NextResponse.json({ text: response.text() });

  } catch (error: any) {
    console.error("ERROR EN EL ÁGORA:", error.message);
    return NextResponse.json({ 
      text: "Sócrates está en silencio. Revisa la ruta /api/excelencia/debug",
      error: error.message 
    }, { status: 500 });
  }
}