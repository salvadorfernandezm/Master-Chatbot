const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkContent() {
  console.log("--- BUSCANDO CONTENIDO DEL CAPÍTULO 10 ---");
  
  // Buscar fragmentos que mencionen "Capítulo 10" o "10.1" o "Referencias"
  const chunks = await prisma.documentChunk.findMany({
    where: {
      OR: [
        { content: { contains: "Capítulo 10" } },
        { content: { contains: "Sección 10.1" } },
        { metadata: { contains: '"page":319' } },
        { metadata: { contains: '"section":500' } }
      ]
    },
    take: 20
  });

  console.log(`Encontrados ${chunks.length} fragmentos potenciales.`);
  
  chunks.forEach((c, idx) => {
    console.log(`\n--- FRAGMENTO ${idx + 1} (ID: ${c.id}) ---`);
    console.log(`METADATA: ${c.metadata}`);
    console.log(`CONTENT (first 300 chars): ${c.content.substring(0, 300)}...`);
  });

  if (chunks.length === 0) {
    console.log("No se encontró nada significativo.");
  }
}

checkContent().catch(console.error).finally(() => prisma.$disconnect());
