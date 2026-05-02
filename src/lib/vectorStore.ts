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
    const chunks = await prisma.documentChunk.findMany(); // Traemos todo para no fallar por IDs
    localDocs = chunks.map((chunk) => ({
      pageContent: chunk.content,
      metadata: typeof chunk.metadata === 'string' ? JSON.parse(chunk.metadata) : chunk.metadata,
    }));
    console.log(`✅ ${localDocs.length} fragmentos listos para consulta.`);
  } catch (error) {
    console.error("Error cargando base de datos:", error.message);
  }
}

export async function searchVectorStore(query: string, knowledgeBaseId: string, limit: number = 30) {
  if (localDocs.length === 0) return [];
  const searchText = query.toLowerCase();

  // BUSCADOR FLEXIBLE: Busca palabras clave de más de 3 letras
  const words = searchText.split(' ').filter(w => w.length > 3);
  
  let matches = localDocs.filter(doc => 
    words.some(word => doc.pageContent.toLowerCase().includes(word))
  );

  // Si no hay coincidencias (preguntas muy generales), enviamos los fragmentos más recientes
  // para que Gemini tenga material de donde sacar información
  if (matches.length === 0) {
    return localDocs.slice(-limit); 
  }

  return matches.slice(0, limit);
}