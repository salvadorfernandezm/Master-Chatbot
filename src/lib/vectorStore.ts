// @ts-nocheck
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

// 1. Configurar los Embeddings
const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: "embedding-001",
});

// 2. Exportar la función que el procesador necesita (ESTO FALTABA)
export async function getEmbeddingsForTexts(texts: string[]) {
  return await embeddings.embedDocuments(texts);
}

let store: any = null;

// 3. Cargar la memoria desde Supabase
export async function loadStoreFromDB(knowledgeBaseId: string, prisma: any) {
  try {
    const { MemoryVectorStore } = await import("langchain/vectorstores/memory");

    const chunks = await prisma.documentChunk.findMany({
      where: { knowledgeBaseId },
    });

    if (chunks.length === 0) return;

    const docs = chunks.map((chunk) => ({
      pageContent: chunk.content,
      metadata: typeof chunk.metadata === 'string' ? JSON.parse(chunk.metadata) : chunk.metadata,
    }));

    store = await MemoryVectorStore.fromDocuments(docs, embeddings);
    console.log(`✅ Memoria cargada con ${chunks.length} fragmentos.`);
  } catch (error) {
    console.error("❌ Error cargando memoria:", error.message);
  }
}

// 4. Función de búsqueda
export async function searchVectorStore(query: string, knowledgeBaseId: string, limit: number = 10) {
  if (!store) return [];
  try {
    const results = await store.similaritySearch(query, limit);
    return results;
  } catch (error) {
    return [];
  }
}

// Asegurarnos de exportar también la función de añadir (por si el procesador la usa)
export async function addDocumentsToStore(docs: any[]) {
    // En memoria, el store se actualiza al cargar de DB
    return; 
}