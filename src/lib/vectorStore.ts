import { prisma } from "./prisma";

// Esta función se queda vacía para no romper otras partes del código
export async function loadStoreFromDB(knowledgeBaseId: string, p: any) {
  return; 
}

// NUEVO BUSCADOR DIRECTO: Rápido y ligero para la nube
export async function searchVectorStore(query: string, knowledgeBaseId: string, limit: number = 10) {
  try {
    // Dividimos la pregunta en palabras para buscar
    const words = query.split(' ').filter(w => w.length > 3);

    // Buscamos directamente en las tablas de Supabase
    const chunks = await prisma.documentChunk.findMany({
      where: {
        knowledgeBaseId: knowledgeBaseId,
        OR: words.length > 0 ? words.map(word => ({
          content: { contains: word, mode: 'insensitive' }
        })) : undefined
      },
      take: limit
    });

    // Si la búsqueda por palabras no arroja nada, traemos fragmentos generales
    if (chunks.length === 0) {
      return await prisma.documentChunk.findMany({
        where: { knowledgeBaseId },
        take: limit
      });
    }

    return chunks.map(c => ({ pageContent: c.content }));
  } catch (error) {
    console.error("Error en búsqueda:", error);
    return [];
  }
}

// Para evitar errores en el procesador de documentos
export async function getEmbeddingsForTexts(texts: string[]) {
    // Esto es temporal por si necesitas subir archivos
    return texts.map(() => new Array(768).fill(0)); 
}