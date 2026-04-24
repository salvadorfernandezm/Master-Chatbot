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
    
    // Traemos los fragmentos (chunks)
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
    console.error("❌ Error en carga:", error.message);
  }
}

export async function searchVectorStore(query: string, knowledgeBaseId: string, limit: number = 20) {
  // --- BÚSQUEDA HÍBRIDA ---
  // 1. Intentamos búsqueda inteligente
  let results = [];
  if (store) {
    results = await store.similaritySearch(query, limit);
  }

  // 2. BÚSQUEDA DE EMERGENCIA (Texto directo por si la inteligente falla)
  // Esto asegura que si el nombre "Alondra" está en el archivo, aparezca SÍ o SÍ.
  const { prisma } = await import("./prisma");
  const words = query.split(' ').filter(w => w.length > 3);
  
  if (words.length > 0) {
    const directChunks = await prisma.documentChunk.findMany({
      where: {
        knowledgeBaseId,
        OR: words.map(w => ({ content: { contains: w, mode: 'insensitive' } }))
      },
      take: 10
    });
    
    directChunks.forEach(c => {
      results.push({ pageContent: c.content, metadata: c.metadata });
    });
  }

  return results;
}