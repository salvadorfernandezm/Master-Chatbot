const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function deepScan() {
  console.log("--- ESCANEO PROFUNDO: SECCIÓN 10 ---");
  
  // Buscar por la palabra clave exacta del encabezado de APA
  const chunks = await prisma.documentChunk.findMany({
    where: {
      OR: [
        { content: { contains: "10.1" } },
        { content: { contains: "Publicaciones periódicas" } },
        { content: { contains: "Journal article" } }
      ]
    },
    take: 10
  });

  console.log(`Encontrados ${chunks.length} fragmentos.`);
  
  for (const c of chunks) {
    console.log(`\nID: ${c.id}`);
    console.log(`METADATA: ${c.metadata}`);
    console.log(`CONTENIDO: ${c.content.substring(0, 500)}...`);
  }
}

deepScan().catch(console.error).finally(() => prisma.$disconnect());
