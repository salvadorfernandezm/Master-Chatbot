// @ts-nocheck
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: "embedding-001",
});

export async function getEmbeddingsForTexts(texts: string[]) {
  return await embeddings.embedDocuments(texts);
}

// ALMACÉN TEMPORAL (Solo de la base actual)
let currentDocs: any[] = [];

export async function loadStoreFromDB(knowledgeBaseId: string, prisma: any) {
  try {
    // FILTRO CRÍTICO: Solo traemos fragmentos que pertenezcan a este chatbot
    const chunks = await prisma.documentChunk.findMany({
      where: { knowledgeBaseId: knowledgeBaseId }
    });

    currentDocs = chunks.map((chunk) => ({
      pageContent: chunk.content,
      metadata: typeof chunk.metadata === 'string' ? JSON.parse(chunk.metadata) : chunk.metadata,
    }));
    
    console.log(`✅ Base de Conocimiento [${knowledgeBaseId}] cargada con ${currentDocs.length} datos.`);
  } catch (error) {
    console.error("❌ Error cargando base de datos:", error.message);
  }
}

export async function searchVectorStore(query: string, knowledgeBaseId: string, limit: number = 30) {
  if (currentDocs.length === 0) return [];
  const searchText = query.toLowerCase();
  
  // Separamos el nombre por palabras (ej. Alondra Casas)
  const words = searchText.split(' ').filter(w => w.length > 2);
  
  // 1. Buscamos filas que tengan TODAS las palabras (Máxima precisión)
  const matches = currentDocs.filter(doc => 
    words.every(word => doc.pageContent.toLowerCase().includes(word))
  );

  if (matches.length > 0) return matches;

  // 2. Si no hay coincidencia exacta, devolvemos una muestra solo de esta base
  return currentDocs.slice(0, limit);
}