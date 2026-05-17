// @ts-nocheck
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { prisma } from "./prisma";

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: "embedding-001",
});

export async function getEmbeddingsForTexts(texts: string[]) {
  return await embeddings.embedDocuments(texts);
}

// Corregimos la "firma" para que acepte los argumentos aunque no los use por ahora
export async function loadStoreFromDB(knowledgeBaseId?: string, p?: any) {
  return; 
}

// Búsqueda directa en Supabase
export async function searchVectorStore(query: string, knowledgeBaseId: string, limit: number = 12) {
  try {
    const words = query.toLowerCase().split(' ').filter(w => w.length > 3);
    const chunks = await prisma.documentChunk.findMany({
      where: {
        knowledgeBaseId,
        OR: words.length > 0 ? words.map(w => ({
          content: { contains: w, mode: 'insensitive' }
        })) : undefined
      },
      take: limit
    });

    if (chunks.length === 0) {
      return await prisma.documentChunk.findMany({ where: { knowledgeBaseId }, take: 5 });
    }

    return chunks.map(c => ({ pageContent: c.content }));
  } catch (error) {
    return [];
  }
}