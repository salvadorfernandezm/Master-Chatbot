import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ text: "Error: No API KEY" }, { status: 500 });

  try {
    const { message, history } = await req.json();
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // PROBAMOS CON EL NOMBRE MÁS RECIENTE Y COMPATIBLE
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "Eres Sócrates, mentor de la 'Iniciativa de Excelencia'. Tu misión es ayudar a alumnos a pulir propuestas académicas sólidas. REGLAS: 1. No aceptes quejas, solo propuestas. 2. Si piden cosas absurdas, cuestiónalos socráticamente. 3. Cuando la propuesta sea digna y formal, termina con: [PROPUESTA_LISTA]." }],
        },
        ...history,
      ],
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    return NextResponse.json({ text: response.text() });

  } catch (error: any) {
    console.error("ERROR CRÍTICO:", error.message);
    
    // Si falla el modelo 1.5, intentamos con el 1.0 como salvavidas
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(message);
        return NextResponse.json({ text: result.response.text() + " (Modo seguro activado)" });
    } catch (e2) {
        return NextResponse.json({ 
            text: "El Ágora está cerrada por mantenimiento de Google.",
            error: error.message 
        }, { status: 500 });
    }
  }
}