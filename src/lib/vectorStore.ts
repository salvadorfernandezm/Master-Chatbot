// @ts-nocheck
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

// Inicializamos los embeddings
const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: "embedding-001",
});

let store: MemoryVectorStore | null = null;

export async function loadStoreFromDB(knowledgeBaseId: string, prisma: any) {
  try {
    const chunks = await prisma.documentChunk.findMany({ 
        where: { knowledgeBaseId },
        take: 100 // Limitamos para no saturar la memoria en el build
    });
    
    const docs = chunks.map(c => ({
      pageContent: c.content,
      metadata: typeof c.metadata === 'string' ? JSON.parse(c.metadata) : c.metadata
    }));

    store = await MemoryVectorStore.fromDocuments(docs, embeddings);
  } catch (e) {
    console.error("Error rehidratando vectores:", e.message);
  }
}

export async function searchVectorStore(query: string, knowledgeBaseId: string, limit: number = 10) {
  if (!store) return [];
  try {
    const results = await store.similaritySearch(query, limit);
    return results.filter(d => d.metadata?.knowledgeBaseId === knowledgeBaseId);
  } catch (e) {
    return [];
  }
}