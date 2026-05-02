// @ts-nocheck
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: "embedding-001",
});

// Esta función es necesaria para el procesador de documentos
export async function getEmbeddingsForTexts(texts: string[]) {
  return await embeddings.embedDocuments(texts);
}

// ALMACÉN TEMPORAL
let localDocs: any[] = [];

export async function loadStoreFromDB(knowledgeBaseId: string, prisma: any) {
  try {
    const chunks = await prisma.documentChunk.findMany({
      where: { knowledgeBaseId },
      take: 100 // Suficiente para traer todos los alumnos y reglas clave
    });

    localDocs = chunks.map((chunk) => ({
      pageContent: chunk.content,
      metadata: typeof chunk.metadata === 'string' ? JSON.parse(chunk.metadata) : chunk.metadata,
    }));
    
    console.log(`✅ ${localDocs.length} datos listos en memoria.`);
  } catch (error) {
    console.error("❌ Error cargando base de datos:", error.message);
  }
}

export async function searchVectorStore(query: string, knowledgeBaseId: string, limit: number = 20) {
  // BYPASS DE MEMORYVECTORSTORE:
  // Si no tenemos datos, devolvemos vacío
  if (localDocs.length === 0) return [];
  
  const searchText = query.toLowerCase();
  
  // 1. Prioridad: Búsqueda exacta (Súper efectivo para correos y nombres)
  const matches = localDocs.filter(doc => 
    doc.pageContent.toLowerCase().includes(searchText)
  );

  if (matches.length > 0) return matches;

  // 2. Si no hay coincidencia exacta, devolvemos una muestra de datos
  // Esto permite que Gemini "lea" la lista si el usuario no es preciso
  return localDocs.slice(0, limit);
}