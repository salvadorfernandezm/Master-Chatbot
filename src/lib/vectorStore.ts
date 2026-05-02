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
    
    // FILTRO ESTRICTO: Buscamos solo los archivos de LA BASE que tiene este chatbot
    const chunks = await prisma.documentChunk.findMany({
      where: { knowledgeBaseId } 
    });

    if (!chunks || chunks.length === 0) {
      console.log(`⚠️ Advertencia: La base ${knowledgeBaseId} no tiene fragmentos.`);
      return;
    }

    const docs = chunks.map((chunk) => ({
      pageContent: chunk.content,
      metadata: typeof chunk.metadata === 'string' ? JSON.parse(chunk.metadata) : chunk.metadata,
    }));

    store = await MemoryVectorStore.fromDocuments(docs, embeddings);
    console.log(`✅ Base de datos [${knowledgeBaseId}] cargada con ${chunks.length} fragmentos.`);
  } catch (error) {
    console.error("Error cargando base de datos:", error.message);
  }
}

export async function searchVectorStore(query: string, knowledgeBaseId: string, limit: number = 30) {
  if (!store) return [];
  try {
    // Buscamos dentro del material específico de este chat
    return await store.similaritySearch(query, limit);
  } catch (error) {
    return [];
  }
}