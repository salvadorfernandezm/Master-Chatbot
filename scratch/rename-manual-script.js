const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function renameDoc() {
  const oldName = "MANUAL APA 7 OCR ADOBE+fox .pdf";
  const newName = "Manual APA 7 edición";

  console.log(`🚀 Iniciando renombramiento de "${oldName}" a "${newName}"...`);

  // 1. Encontrar el documento
  const doc = await prisma.document.findFirst({
    where: { filename: oldName }
  });

  if (!doc) {
    console.error("❌ No se encontró el documento con el nombre especificado.");
    process.exit(1);
  }

  console.log(`✅ Documento encontrado (ID: ${doc.id}). Actualizando...`);

  // 2. Transacción para actualizar Documento y Chunks
  try {
    await prisma.$transaction(async (tx) => {
      // Actualizar nombre del documento
      await tx.document.update({
        where: { id: doc.id },
        data: { filename: newName }
      });

      // Actualizar todos los chunks
      // Como metadata es un string JSON, tenemos que hacerlo con cuidado.
      // En SQLite no podemos hacer updates complejos de JSON fácilmente con Prisma sin traerlos a memoria
      // o usar raw query. Dado que pueden ser miles de chunks, lo haremos por lotes.
      
      const chunks = await tx.documentChunk.findMany({
        where: { documentId: doc.id }
      });

      console.log(`📦 Procesando ${chunks.length} fragmentos...`);

      for (const chunk of chunks) {
        let metadata = JSON.parse(chunk.metadata);
        if (metadata.source === oldName) {
          metadata.source = newName;
          await tx.documentChunk.update({
            where: { id: chunk.id },
            data: { metadata: JSON.stringify(metadata) }
          });
        }
      }
    });

    console.log("✨ Renombramiento completado con éxito.");
  } catch (error) {
    console.error("❌ Error durante la transacción:", error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

renameDoc();
