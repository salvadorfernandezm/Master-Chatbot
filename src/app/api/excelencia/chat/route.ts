import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ text: "Falta la API KEY en el búnker." }, { status: 500 });
  }

  try {
    const body = await req.json();
    const userMessage = body.message;
    const history = body.history || [];

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // CAMBIO DEFINITIVO: Usamos el modelo 1.5 Flash estable. 
    // Es rápido, inteligente y tiene las cuotas más amplias.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "Eres Sócrates, el mentor de la 'Iniciativa de Excelencia' de la Facultad. Tu misión: ayudar a los alumnos a pulir sus ideas. REGLAS: 1. No aceptes quejas, pide soluciones. 2. Si piden cosas absurdas (gimnasio, alberca, café), cuestiónalos: ¿Cómo ayuda esto al intelecto? 3. Si la idea es buena, ayúdalos a redactarla formalmente. 4. Cuando la propuesta sea digna, termina con: [PROPUESTA_LISTA]." }],
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
    
    // Si incluso el 1.5 falla, devolvemos un mensaje más amigable
    return NextResponse.json({ 
      text: "Sócrates ha salido un momento al foro. Por favor, intenta de nuevo en un minuto.",
      error: error.message 
    }, { status: 500 });
  }
}