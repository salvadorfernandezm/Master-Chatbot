const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkPages() {
  console.log("--- CONTEO DE PÁGINAS POR DOCUMENTO ---");
  
  const documents = await prisma.document.findMany();
  for (const doc of documents) {
    const chunks = await prisma.documentChunk.findMany({
      where: { documentId: doc.id }
    });
    
    // Extraer páginas de los metadatos
    const pages = new Set();
    chunks.forEach(c => {
      try {
        const meta = JSON.parse(c.metadata);
        if (meta.page) pages.add(meta.page);
        if (meta.section) pages.add(`Sec ${meta.section}`);
      } catch(e) {}
    });

    const pageArray = Array.from(pages).sort((a, b) => {
       const numA = parseInt(a.toString().replace("Sec ", ""));
       const numB = parseInt(b.toString().replace("Sec ", ""));
       return numA - numB;
    });

    console.log(`\nDocumento: ${doc.filename}`);
    console.log(`Total Chunks: ${chunks.length}`);
    console.log(`Rango de páginas: ${pageArray[0]} a ${pageArray[pageArray.length - 1]}`);
    console.log(`Número total de páginas únicas detectadas: ${pages.size}`);
  }
}

checkPages().catch(console.error).finally(() => prisma.$disconnect());
