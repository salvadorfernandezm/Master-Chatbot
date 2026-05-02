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
    // Subimos a 3000 para que nunca se quede nada fuera
    const chunks = await prisma.documentChunk.findMany({ take: 3000 });
    localDocs = chunks.map((chunk) => ({
      pageContent: chunk.content,
      metadata: typeof chunk.metadata === 'string' ? JSON.parse(chunk.metadata) : chunk.metadata,
    }));
    console.log(`✅ Base de datos cargada: ${localDocs.length} fragmentos.`);
  } catch (error) {
    console.error("Error en DB:", error.message);
  }
}

export async function searchVectorStore(query: string, knowledgeBaseId: string, limit: number = 30) {
  if (localDocs.length === 0) return [];
  const searchText = query.toLowerCase();
  
  // SEPARAR NOMBRE POR PALABRAS (Ej: "Alondra Casas" -> ["alondra", "casas"])
  const words = searchText.split(' ').filter(w => w.length > 2);
  
  // Buscar filas que tengan las palabras del nombre O el correo
  const matches = localDocs.filter(doc => 
    words.every(word => doc.pageContent.toLowerCase().includes(word))
  );

  return matches.length > 0 ? matches : localDocs.slice(0, limit);
}