// @ts-nocheck
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: "embedding-001",
});

export async function getEmbeddingsForTexts(texts: string[]) {
  return await embeddings.embedDocuments(texts);
}

let store: any = null;

export async function loadStoreFromDB(knowledgeBaseId: string, prisma: any) {
  try {
    const { MemoryVectorStore } = await import("langchain/vectorstores/memory");
    const chunks = await prisma.documentChunk.findMany({ where: { knowledgeBaseId } });
    if (!chunks || chunks.length === 0) return;
    const docs = chunks.map((chunk) => ({
      pageContent: chunk.content,
      metadata: typeof chunk.metadata === 'string' ? JSON.parse(chunk.metadata) : chunk.metadata,
    }));
    store = await MemoryVectorStore.fromDocuments(docs, embeddings);
  } catch (error) {
    console.error("❌ Error en carga:", error.message);
  }
}

export async function searchVectorStore(query: string, knowledgeBaseId: string, limit: number = 20) {
  let results = [];
  if (store) {
    results = await store.similaritySearch(query, limit);
  }

  // --- BÚSQUEDA DE PALABRA EXACTA (EL SECRETO) ---
  const { prisma } = await import("./prisma");
  const words = query.toLowerCase().split(/[ @.]+/).filter(w => w.length > 4);
  
  if (words.length > 0) {
    const directResults = await prisma.documentChunk.findMany({
      where: {
        knowledgeBaseId,
        OR: words.map(w => ({ content: { contains: w, mode: 'insensitive' } }))
      },
      take: 5
    });
    
    directResults.forEach(c => {
      results.push({ pageContent: c.content, metadata: {} });
    });
  }

  return results;
}