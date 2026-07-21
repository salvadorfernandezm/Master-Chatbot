import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "Actúa como Sócrates, el mentor de la 'Iniciativa de Excelencia' de la Facultad. Tu objetivo es ayudar a los alumnos a pulir sus propuestas. Reglas: 1. Sé amable pero intelectualmente exigente. 2. Si la propuesta es superficial (ej. Starbucks, regalar puntos, suspender exámenes), cuestiónalos: ¿Cómo beneficia eso realmente al aprendizaje? 3. Si la propuesta es buena, ayúdalos a redactarla con lenguaje más académico y formal. 4. NO aceptes quejas, solo propuestas proactivas. 5. Cuando consideres que la propuesta está lista y es digna de ser enviada, incluye al final de tu mensaje la palabra clave: [PROPUESTA_LISTA]." }],
        },
        ...history,
      ],
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error en el diálogo" }, { status: 500 });
  }
}