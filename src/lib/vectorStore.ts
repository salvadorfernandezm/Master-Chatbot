// @ts-nocheck
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: "embedding-001",
});

export async function getEmbeddingsForTexts(texts: string[]) {
  return await embeddings.embedDocuments(texts);
}

let localDocs: any[] = [];

export async function loadStoreFromDB(knowledgeBaseId: string, prisma: any) {
  try {
    // CAMBIO VITAL: Subimos de 100 a 2000 para que quepa el APA y las NOTAS
    const chunks = await prisma.documentChunk.findMany({
      take: 2000 
    });

    localDocs = chunks.map((chunk) => ({
      pageContent: chunk.content,
      metadata: typeof chunk.metadata === 'string' ? JSON.parse(chunk.metadata) : chunk.metadata,
    }));
    
    console.log(`✅ ${localDocs.length} datos listos para el Maestro Salvador.`);
  } catch (error) {
    console.error("❌ Error en carga:", error.message);
  }
}

export async function searchVectorStore(query: string, knowledgeBaseId: string, limit: number = 30) {
  if (localDocs.length === 0) return [];
  
  const searchText = query.toLowerCase();
  const words = searchText.split(' ').filter(w => w.length > 3);
  
  // 1. Buscamos coincidencias reales (Filtro por palabra)
  let matches = localDocs.filter(doc => 
    words.some(word => doc.pageContent.toLowerCase().includes(word))
  );

  // 2. Si no hay coincidencia, mandamos una muestra amplia
  return matches.length > 0 ? matches.slice(0, limit) : localDocs.slice(0, limit);
}