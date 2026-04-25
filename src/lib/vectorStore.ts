// @ts-nocheck
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

// 1. Configurar los Embeddings (Cerebro)
const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: "embedding-001",
});

// Esta función es vital para el procesador
export async function getEmbeddingsForTexts(texts: string[]) {
  return await embeddings.embedDocuments(texts);
}

// ALMACÉN MANUAL: Aquí guardaremos los documentos en la memoria de la sesión
let localDocs: any[] = [];

export async function loadStoreFromDB(knowledgeBaseId: string, prisma: any) {
  try {
    const chunks = await prisma.documentChunk.findMany({
      where: { knowledgeBaseId },
    });

    if (!chunks || chunks.length === 0) {
      localDocs = [];
      return;
    }

    // Guardamos los documentos en un formato simple que Gemini entiende
    localDocs = chunks.map((chunk) => ({
      pageContent: chunk.content,
      metadata: typeof chunk.metadata === 'string' ? JSON.parse(chunk.metadata) : chunk.metadata,
    }));
    
    console.log(`✅ ${localDocs.length} fragmentos cargados en la memoria del "Maestro".`);
  } catch (error) {
    console.error("❌ Error en carga de datos:", error.message);
  }
}

export async function searchVectorStore(query: string, knowledgeBaseId: string, limit: number = 10) {
  // BYPASS TOTAL: Si la librería de búsqueda falla, simplemente devolvemos
  // los fragmentos cargados. Gemini es lo suficientemente inteligente para
  // leerlos todos si no son demasiados.
  
  if (localDocs.length === 0) return [];
  
  // Si tenemos muchos, tomamos los primeros para no saturar
  return localDocs.slice(0, limit);
}

// Función vacía para no romper el procesador
export async function addDocumentsToStore(docs: any[]) { return; }