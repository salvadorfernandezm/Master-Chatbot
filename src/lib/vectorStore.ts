// @ts-nocheck
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

// Inicializamos los embeddings (esto sí lo encuentra bien)
const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: "embedding-001",
});

let store: any = null;

export async function loadStoreFromDB(knowledgeBaseId: string, prisma: any) {
  try {
    // EL CABALLO DE TROYA: Importamos la librería aquí adentro
    // Así Vercel no la busca durante el "Build" y no da error rojo
    const { MemoryVectorStore } = await import("langchain/vectorstores/memory");

    const chunks = await prisma.documentChunk.findMany({ 
        where: { knowledgeBaseId }
    });
    
    const docs = chunks.map(c => ({
      pageContent: c.content,
      metadata: typeof c.metadata === 'string' ? JSON.parse(c.metadata) : c.metadata
    }));

    store = await MemoryVectorStore.fromDocuments(docs, embeddings);
    console.log("✅ Memoria vectorial cargada con éxito.");
  } catch (e) {
    console.error("❌ Error en loadStoreFromDB:", e.message);
  }
}

export async function searchVectorStore(query: string, knowledgeBaseId: string, limit: number = 10) {
  if (!store) return [];
  try {
    const results = await store.similaritySearch(query, limit);
    return results.filter(d => d.metadata?.knowledgeBaseId === knowledgeBaseId);
  } catch (e) {
    return [];
  }
}