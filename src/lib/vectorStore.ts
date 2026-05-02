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
    const chunks = await prisma.documentChunk.findMany(); // Trae todo lo de tu cuenta
    localDocs = chunks.map((chunk) => ({
      pageContent: chunk.content,
      metadata: typeof chunk.metadata === 'string' ? JSON.parse(chunk.metadata) : chunk.metadata,
    }));
    console.log(`✅ ${localDocs.length} datos listos.`);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

export async function searchVectorStore(query: string, knowledgeBaseId: string, limit: number = 30) {
  if (localDocs.length === 0) return [];
  const searchText = query.toLowerCase();

  // FILTRO INTELIGENTE MANUAL:
  // Buscamos fragmentos que contengan al menos una palabra clave de la pregunta del alumno
  const words = searchText.split(' ').filter(w => w.length > 3);
  
  const results = localDocs.filter(doc => {
    return words.some(word => doc.pageContent.toLowerCase().includes(word));
  });

  // Si no hay coincidencias exactas, le mandamos una mezcla aleatoria (así pillamos el APA o Etxeberria)
  return results.length > 0 ? results.slice(0, limit) : localDocs.slice(0, limit);
}