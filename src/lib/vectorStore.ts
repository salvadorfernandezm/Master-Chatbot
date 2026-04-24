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
    // IMPORTACIÓN DINÁMICA MEJORADA
    const { MemoryVectorStore } = await import("langchain/vectorstores/memory");
    
    const chunks = await prisma.documentChunk.findMany({
        where: { knowledgeBaseId }
    });

    if (!chunks || chunks.length === 0) return;

    const docs = chunks.map((chunk) => ({
      pageContent: chunk.content,
      metadata: typeof chunk.metadata === 'string' ? JSON.parse(chunk.metadata) : chunk.metadata,
    }));

    store = await MemoryVectorStore.fromDocuments(docs, embeddings);
    console.log(`✅ Memoria cargada: ${chunks.length} fragmentos.`);
  } catch (error) {
    console.error("❌ Error en carga de memoria:", error.message);
  }
}

export async function searchVectorStore(query: string, knowledgeBaseId: string, limit: number = 20) {
  if (!store) return [];
  try {
    return await store.similaritySearch(query, limit);
  } catch (error) {
    console.error("❌ Error en búsqueda:", error.message);
    return [];
  }
}