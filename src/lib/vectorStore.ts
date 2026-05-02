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
    // FILTRO TOTAL: Solo cargamos los fragmentos de LA BASE asignada
    const chunks = await prisma.documentChunk.findMany({
      where: { knowledgeBaseId: knowledgeBaseId }
    });

    localDocs = chunks.map((chunk) => ({
      pageContent: chunk.content,
      metadata: typeof chunk.metadata === 'string' ? JSON.parse(chunk.metadata) : chunk.metadata,
    }));
    
    console.log(`✅ Base [${knowledgeBaseId}] cargada: ${localDocs.length} datos.`);
  } catch (error) {
    console.error("❌ Error en DB:", error.message);
  }
}

export async function searchVectorStore(query: string, knowledgeBaseId: string, limit: number = 30) {
  if (localDocs.length === 0) return [];
  const searchText = query.toLowerCase();
  
  // Separamos las palabras clave
  const words = searchText.split(' ').filter(w => w.length > 3);
  
  // Buscamos coincidencias dentro de esta base específica
  const matches = localDocs.filter(doc => 
    words.some(word => doc.pageContent.toLowerCase().includes(word))
  );

  // Si no hay coincidencias exactas, mandamos una muestra amplia del archivo
  return matches.length > 0 ? matches : localDocs.slice(0, limit);
}