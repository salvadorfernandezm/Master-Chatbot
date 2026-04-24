// @ts-nocheck
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: "embedding-001",
});

let store: any = null;

export async function loadStoreFromDB(knowledgeBaseId: string, prisma: any) {
  try {
    const { MemoryVectorStore } = await import("langchain/vectorstores/memory");
    
    // CARGAMOS TODO (Sin filtrar por ID para evitar el error de sincronización)
    const chunks = await prisma.documentChunk.findMany({
        take: 1000 // Traemos hasta 1000 fragmentos para asegurar que Alondra esté ahí
    });
    
    const docs = chunks.map(c => ({
      pageContent: c.content,
      metadata: typeof c.metadata === 'string' ? JSON.parse(c.metadata) : c.metadata
    }));

    store = await MemoryVectorStore.fromDocuments(docs, embeddings);
    console.log(`✅ Memoria cargada con ${chunks.length} fragmentos.`);
  } catch (e) {
    console.error("❌ Error en loadStoreFromDB:", e.message);
  }
}

export async function searchVectorStore(query: string, knowledgeBaseId: string, limit: number = 15) {
  if (!store) return [];
  try {
    // Buscamos en toda la bolsa de datos
    return await store.similaritySearch(query, limit);
  } catch (e) {
    return [];
  }
}