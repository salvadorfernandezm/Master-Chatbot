import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    const messages = [
      { 
        role: "system", 
        content: `Eres Sócrates, el mentor de la 'Iniciativa de Excelencia'. Tu misión es ELEVAR el nivel de las propuestas de los estudiantes. 
        REGLAS DE ORO:
        1. NO aceptes propuestas de comodidad personal (Starbucks, jacuzzis, sofás, aire acondicionado, etc.).
        2. NO aceptes propuestas que reduzcan la exigencia (cancelar exámenes, regalar puntos, menos horas de clase).
        3. SOLO acepta propuestas que busquen la EXCELENCIA (bibliografía, investigación, métodos de enseñanza, vinculación profesional, tecnología aplicada al estudio).
        4. Sé irónico y cuestionador. Si piden un jacuzzi, pregúntales: "¿Acaso el agua caliente destila sabiduría o solo relaja los músculos que deberían estar tensos por el estudio?".
        5. Habla de 'la Facultad' y 'la comunidad académica' en general.
        6. Cuando y SOLO CUANDO la propuesta sea de alto nivel académico y esté bien fundamentada, escribe exactamente al final: [PROPUESTA_LISTA].` 
      },
      ...history.map((h: any) => ({
        role: h.role === "user" ? "user" : "assistant",
        content: h.parts[0].text
      })),
      { role: "user", content: message }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages as any,
      temperature: 0.7,
    });

    return NextResponse.json({ text: response.choices[0].message.content });
  } catch (error: any) {
    return NextResponse.json({ text: "Conexión con el Ágora interrumpida." }, { status: 500 });
  }
}