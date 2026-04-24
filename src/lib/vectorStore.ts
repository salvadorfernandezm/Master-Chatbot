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
    
    // CARGAMOS ABSOLUTAMENTE TODO LO QUE HAYA EN LA NUBE
    const chunks = await prisma.documentChunk.findMany();

    if (!chunks || chunks.length === 0) {
      console.log("⚠️ Supabase no tiene datos aún.");
      return;
    }

    const docs = chunks.map((chunk) => ({
      pageContent: chunk.content,
      metadata: chunk.metadata,
    }));

    store = await MemoryVectorStore.fromDocuments(docs, embeddings);
    console.log(`✅ Memoria cargada con éxito: ${chunks.length} fragmentos encontrados.`);
  } catch (error) {
    console.error("❌ Error cargando memoria:", error.message);
  }
}

export async function searchVectorStore(query: string, knowledgeBaseId: string, limit: number = 15) {
  if (!store) return [];
  try {
    // Buscamos en toda la bolsa de datos sin filtros de ID
    return await store.similaritySearch(query, limit);
  } catch (error) {
    return [];
  }
}