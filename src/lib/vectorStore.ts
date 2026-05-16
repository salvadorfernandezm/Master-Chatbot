// @ts-nocheck
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { prisma } from "./prisma";

// Configuración de los Embeddings
const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: "embedding-001",
});

export async function getEmbeddingsForTexts(texts: string[]) {
  return await embeddings.embedDocuments(texts);
}

// Búsqueda ultrarápida directa en Supabase (Sin librerías que fallen)
export async function searchVectorStore(query: string, knowledgeBaseId: string, limit: number = 12) {
  try {
    const words = query.toLowerCase().split(' ').filter(w => w.length > 3);

    const chunks = await prisma.documentChunk.findMany({
      where: {
        knowledgeBaseId,
        OR: words.length > 0 ? words.map(word => ({
          content: { contains: word, mode: 'insensitive' }
        })) : undefined
      },
      take: limit
    });

    if (chunks.length === 0) {
      return await prisma.documentChunk.findMany({ where: { knowledgeBaseId }, take: 5 });
    }

    return chunks.map(c => ({ pageContent: c.content }));
  } catch (error) {
    console.error("Error en búsqueda:", error);
    return [];
  }
}

export async function loadStoreFromDB() { return; }