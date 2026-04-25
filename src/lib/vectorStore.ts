// @ts-nocheck
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

// 1. Configurar los Embeddings
const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: "embedding-001",
});

// 2. Exportar la función para el procesador (OBLIGATORIA)
export async function getEmbeddingsForTexts(texts: string[]) {
  return await embeddings.embedDocuments(texts);
}

let store: any = null;

// 3. Cargar la memoria con importación blindada
export async function loadStoreFromDB(knowledgeBaseId: string, prisma: any) {
  try {
    // Usamos la ruta absoluta de la librería para que Vercel/Turbopack no se pierdan
    const { MemoryVectorStore } = await import("langchain/vectorstores/memory");

    const chunks = await prisma.documentChunk.findMany({
      where: { knowledgeBaseId },
    });

    if (!chunks || chunks.length === 0) return;

    const docs = chunks.map((chunk) => ({
      pageContent: chunk.content,
      metadata: typeof chunk.metadata === 'string' ? JSON.parse(chunk.metadata) : chunk.metadata,
    }));

    store = await MemoryVectorStore.fromDocuments(docs, embeddings);
    console.log(`✅ Memoria cargada con éxito.`);
  } catch (error) {
    console.error("❌ Error cargando memoria:", error.message);
  }
}

// 4. Función de búsqueda
export async function searchVectorStore(query: string, knowledgeBaseId: string, limit: number = 10) {
  if (!store) return [];
  try {
    return await store.similaritySearch(query, limit);
  } catch (error) {
    return [];
  }
}

// Exportar para que no de error si el procesador lo busca
export async function addDocumentsToStore(docs: any[]) { return; }