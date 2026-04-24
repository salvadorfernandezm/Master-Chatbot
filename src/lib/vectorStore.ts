// @ts-nocheck
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: "embedding-001",
  taskType: TaskType.RETRIEVAL_DOCUMENT,
});

let store: MemoryVectorStore | null = null;

export async function loadStoreFromDB(knowledgeBaseId: string, prisma: any) {
  const chunks = await prisma.documentChunk.findMany({ where: { knowledgeBaseId } });
  const docs = chunks.map(c => ({
    pageContent: c.content,
    metadata: typeof c.metadata === 'string' ? JSON.parse(c.metadata) : c.metadata
  }));
  store = await MemoryVectorStore.fromDocuments(docs, embeddings);
}

export async function searchVectorStore(query: string, knowledgeBaseId: string, limit: number = 10) {
  if (!store) return [];
  try {
    // Búsqueda simple de similitud: no falla nunca.
    const results = await store.similaritySearch(query, limit);
    return results.filter(d => d.metadata?.knowledgeBaseId === knowledgeBaseId);
  } catch (e) {
    return [];
  }
}