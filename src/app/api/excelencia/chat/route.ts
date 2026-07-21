import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Usamos el nombre que ya tienes en Vercel: GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    // Verificamos si la llave existe en el servidor
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ text: "Error: El búnker no tiene la llave GEMINI_API_KEY configurada." }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "Eres Sócrates, el mentor de la 'Iniciativa de Excelencia'. Tu misión es ayudar a los alumnos a transformar ideas simples en propuestas académicas sólidas. REGLAS: 1. No aceptes quejas, solo propuestas proactivas. 2. Si piden cosas absurdas o superficiales (como café, gimnasios o puntos), cuestiónalos con ironía socrática para que piensen en la excelencia académica. 3. Ayúdalos a redactar de forma elegante y formal. 4. Cuando la propuesta sea digna de la Facultad, termina tu mensaje con la clave exacta: [PROPUESTA_LISTA]." }],
        },
        ...history,
      ],
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("ERROR SOCRÁTICO:", error);
    return NextResponse.json({ error: "Conexión con el Ágora interrumpida", details: error.message }, { status: 500 });
  }
}