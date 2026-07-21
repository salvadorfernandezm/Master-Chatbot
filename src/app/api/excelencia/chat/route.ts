import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ text: "Error: Falta la OPENAI_API_KEY en el búnker." }, { status: 500 });
  }

  try {
    const { message, history } = await req.json();

    // Convertimos el historial al formato que le gusta a OpenAI
    const messages = [
      { 
        role: "system", 
        content: "Eres Sócrates, el mentor de la 'Iniciativa de Excelencia' de la Facultad. Tu misión es ayudar a los alumnos a transformar ideas simples en propuestas académicas sólidas. REGLAS: 1. No aceptes quejas, solo propuestas. 2. Si piden cosas superficiales (gimnasios, albercas, café), cuestiónalos socráticamente: ¿Cómo ayuda eso al intelecto? 3. Cuando la propuesta sea digna, termina tu mensaje con la clave exacta: [PROPUESTA_LISTA]." 
      },
      ...history.map((h: any) => ({
        role: h.role === "user" ? "user" : "assistant",
        content: h.parts[0].text
      })),
      { role: "user", content: message }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // El modelo más eficiente y rápido
      messages: messages as any,
      temperature: 0.7,
    });

    const text = response.choices[0].message.content;

    return NextResponse.json({ text });

  } catch (error: any) {
    console.error("ERROR EN EL ÁGORA (OpenAI):", error.message);
    return NextResponse.json({ 
      text: "Sócrates ha tenido que salir de urgencia. Intenta de nuevo en un momento.",
      error: error.message 
    }, { status: 500 });
  }
}