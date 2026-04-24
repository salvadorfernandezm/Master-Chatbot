import { Document } from "@langchain/core/documents";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { TaskType } from "@google/generative-ai";

// Initialize embeddings with the same key used for chat
const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: "gemini-embedding-001", // Corrected name from models list
  taskType: TaskType.RETRIEVAL_DOCUMENT,
});

const globalForVectorStore = globalThis as unknown as {
  vectorStore: MemoryVectorStore | undefined;
  kbLoadedIds: Set<string> | undefined;
};

// Track which KBs have been loaded into the memory store to avoid duplicate loading
if (!globalForVectorStore.kbLoadedIds) {
  globalForVectorStore.kbLoadedIds = new Set();
}

export const getVectorStore = async (): Promise<MemoryVectorStore> => {
  if (!globalForVectorStore.vectorStore) {
    globalForVectorStore.vectorStore = new MemoryVectorStore(embeddings);
  }
  return globalForVectorStore.vectorStore;
};

/**
 * Genera embeddings para una lista de textos. 
 * Útil para guardarlos en la base de datos y evitar re-generarlos.
 */
export const getEmbeddingsForTexts = async (texts: string[]): Promise<number[][]> => {
  return await embeddings.embedDocuments(texts);
};

export const addDocumentsToStore = async (docs: Document[]) => {
  const store = await getVectorStore();
  console.log(`🧠 Agregando ${docs.length} documentos al almacén de vectores...`);
  await store.addDocuments(docs);
  
  // Marcar los IDs de KB como cargados
  docs.forEach(doc => {
    if (doc.metadata?.knowledgeBaseId) {
      globalForVectorStore.kbLoadedIds?.add(doc.metadata.knowledgeBaseId);
    }
  });
};

/**
 * Rehidrata el VectorStore desde la base de datos para un grupo específico.
 * Evita la "amnesia" del chatbot tras reinicios del servidor.
 */
export const loadStoreFromDB = async (knowledgeBaseId: string, prisma: any) => {
  if (globalForVectorStore.kbLoadedIds?.has(knowledgeBaseId)) {
    return; // Ya cargado
  }

  console.log(`🔄 Rehidratando memoria vectorial para KB: ${knowledgeBaseId}...`);
  const chunks = await prisma.documentChunk.findMany({
    where: { knowledgeBaseId, NOT: { embedding: null } }
  });

  if (chunks.length === 0) {
    console.log("⚠️ No hay vectores guardados para esta base de conocimientos.");
    return;
  }

  const store = await getVectorStore();
  const documents = chunks.map((c: any) => {
    const metadata = JSON.parse(c.metadata);
    return new Document({
      pageContent: c.content,
      metadata: metadata,
    });
  });

  const vectors = chunks.map((c: any) => JSON.parse(c.embedding));
  
  // Agregar directamente al almacén de memoria sin recalcular embeddings
  await store.addVectors(vectors, documents);
  globalForVectorStore.kbLoadedIds?.add(knowledgeBaseId);
  console.log(`✅ ${chunks.length} vectores recuperados de la base de datos.`);
};

export const searchVectorStore = async (query: string, knowledgeBaseId: string, limit = 10) => {
  const store = await getVectorStore();
  
  try {
  const results = await store.similaritySearch(query, limit);
  // Filtramos manualmente para evitar el error de 'metadata' undefined
  return results.filter(doc => {
    const meta = typeof doc?.metadata === 'string' ? JSON.parse(doc.metadata) : doc?.metadata;
    return meta?.knowledgeBaseId === knowledgeBaseId;
  });
} catch (error) {
  console.error("❌ Error en búsqueda vectorial:", error.message);
  return [];
}
  }
};
