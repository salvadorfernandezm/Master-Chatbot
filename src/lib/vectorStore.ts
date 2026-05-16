// @ts-nocheck
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
  modelName: "embedding-001",
});

// Función necesaria para subir archivos
export async function getEmbeddingsForTexts(texts: string[]) {
  return await embeddings.embedDocuments(texts);
}

export async function loadStoreFromDB(knowledgeBaseId: string, prisma: any) {
  // En esta versión simplificada no hace falta cargar en memoria
  return; 
}

export async function searchVectorStore(query: string, knowledgeBaseId: string, limit: number = 10) {
  try {
    const { prisma } = await import("./prisma");
    
    // BUSCADOR DE EMERGENCIA: Buscamos directamente en Supabase
    // Esto es lo que salvará la prueba Beta
    const words = query.toLowerCase().split(' ').filter(w => w.length > 3);
    
    const chunks = await prisma.documentChunk.findMany({
      where: {
        knowledgeBaseId,
        OR: words.length > 0 ? words.map(w => ({ content: { contains: w, mode: 'insensitive' } })) : undefined
      },
      take: limit
    });

    if (chunks.length === 0) {
        return await prisma.documentChunk.findMany({ where: { knowledgeBaseId }, take: limit });
    }

    return chunks.map(c => ({ pageContent: c.content, metadata: {} }));
  } catch (error) {
    return [];
  }
}