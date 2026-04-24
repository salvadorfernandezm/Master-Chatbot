// @ts-nocheck
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";

let store: MemoryVectorStore | null = null;

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: "embedding-001",
  taskType: TaskType.RETRIEVAL_DOCUMENT,
});

export async function loadStoreFromDB(knowledgeBaseId: string, prisma: any) {
  const chunks = await prisma.documentChunk.findMany({
    where: { knowledgeBaseId },
  });

  const docs = chunks.map((chunk) => ({
    pageContent: chunk.content,
    metadata: typeof chunk.metadata === 'string' ? JSON.parse(chunk.metadata) : chunk.metadata,
  }));

  store = await MemoryVectorStore.fromDocuments(docs, embeddings);
}

export async function searchVectorStore(query: string, knowledgeBaseId: string, limit: number = 10) {
  if (!store) return [];

  try {
    // Búsqueda simple de similitud (más robusta que MMR para evitar el error de metadata)
    const results = await store.similaritySearch(query, limit);
    
    // Filtro de seguridad manual
    return results.filter(doc => {
      const meta = doc.metadata;
      return meta && meta.knowledgeBaseId === knowledgeBaseId;
    });
  } catch (error) {
    console.error("❌ Error en búsqueda:", error.message);
    return [];
  }
}