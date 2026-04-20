const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function findS10_1() {
  console.log("--- BÚSQUEDA EXHAUSTIVA DE SECCIÓN 10.1 ---");
  
  const chunks = await prisma.documentChunk.findMany({
    where: {
      content: { contains: "10.1" }
    }
  });

  console.log(`Encontrados ${chunks.length} fragmentos.`);
  
  for (const c of chunks) {
    if (c.content.includes("10.1") && c.content.includes("periodical")) {
       console.log("¡ENCONTRADO POSIBLE TÍTULO!");
    }
    console.log(`\nID: ${c.id}`);
    console.log(`PAGE/SECTION: ${c.metadata}`);
    console.log(`CONTENT: ${c.content.substring(0, 200)}`);
  }
}

findS10_1().catch(console.error).finally(() => prisma.$disconnect());
