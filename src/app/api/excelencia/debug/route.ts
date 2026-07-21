import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "No hay API KEY" });

  try {
    // Intentamos listar los modelos disponibles
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    
    // Extraemos solo los nombres para que sea fácil de leer
    const modelos = data.models?.map((m: any) => m.name) || "No se encontraron modelos";

    return NextResponse.json({ 
      mensaje: "Estos son los nombres que Sócrates acepta:",
      modelos 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}