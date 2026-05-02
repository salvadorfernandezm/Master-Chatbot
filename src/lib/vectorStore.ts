// @ts-nocheck
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

// Forzamos el uso de la llave sea cual sea el nombre que prefiera la librería
const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY,
  modelName: "embedding-001",
});

export async function getEmbeddingsForTexts(texts: string[]) {
  return await embeddings.embedDocuments(texts);
}

let localDocs: any[] = [];

export async function loadStoreFromDB(knowledgeBaseId: string, prisma: any) {
  try {
    const chunks = await prisma.documentChunk.findMany({ where: { knowledgeBaseId } });
    localDocs = chunks.map((chunk) => ({
      pageContent: chunk.content,
      metadata: typeof chunk.metadata === 'string' ? JSON.parse(chunk.metadata) : chunk.metadata,
    }));
  } catch (error) {
    console.error("❌ Error en carga:", error.message);
  }
}

export async function searchVectorStore(query: string, knowledgeBaseId: string, limit: number = 10) {
  if (localDocs.length === 0) return [];
  const searchText = query.toLowerCase();
  const matches = localDocs.filter(doc => doc.pageContent.toLowerCase().includes(searchText));
  return matches.length > 0 ? matches : localDocs.slice(0, limit);
}