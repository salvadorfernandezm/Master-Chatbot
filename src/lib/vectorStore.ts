// @ts-nocheck
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: "embedding-001",
});

export async function getEmbeddingsForTexts(texts: string[]) {
  return await embeddings.embedDocuments(texts);
}

// Búsqueda directa y veloz en Supabase
export async function searchVectorStore(query: string, knowledgeBaseId: string, limit: number = 10) {
  const { prisma } = await import("./prisma");
  try {
    const words = query.split(' ').filter(w => w.length > 3);
    const chunks = await prisma.documentChunk.findMany({
      where: {
        knowledgeBaseId,
        OR: words.length > 0 ? words.map(w => ({ content: { contains: w, mode: 'insensitive' } })) : undefined
      },
      take: limit
    });
    return chunks.length > 0 ? chunks.map(c => ({ pageContent: c.content })) : [];
  } catch (error) {
    return [];
  }
}

export async function loadStoreFromDB() { return; }