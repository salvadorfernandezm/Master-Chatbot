import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const kbs = await prisma.knowledgeBase.findMany();
  console.log("=== KNOWLEDGE BASES ===");
  for (const kb of kbs) {
    const count = await prisma.documentChunk.count({ where: { knowledgeBaseId: kb.id } });
    console.log(`KB: ${kb.name} (${kb.id}) -> ${count} chunks`);
    
    if (count > 0) {
      console.log("Sampling last 5 chunks (potential end of document):");
      const lastChunks = await prisma.documentChunk.findMany({
        where: { knowledgeBaseId: kb.id },
        take: 5,
        orderBy: { id: 'desc' }
      });
      lastChunks.forEach(c => {
        const metadata = JSON.parse(c.metadata);
        console.log(`- Page ${metadata.page}: "${c.content.substring(0, 100)}..."`);
      });
    }
  }
}

main().catch(console.error);
