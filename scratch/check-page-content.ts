import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const kbId = "cmns9qqhs0004v6d8g4rr175l";
  
  console.log("=== SEARCHING PAGE 319 ===");
  const p319 = await prisma.documentChunk.findMany({
    where: { 
      knowledgeBaseId: kbId,
      metadata: { contains: '"page":319' }
    }
  });
  p319.forEach(c => console.log(`[p.319]: ${c.content.substring(0, 200)}...`));

  console.log("\n=== SEARCHING WORD 'revista' IN LATER PAGES (>100) ===");
  const revista = await prisma.documentChunk.findMany({
    where: {
      knowledgeBaseId: kbId,
      content: { contains: "revista" },
      NOT: [
        { metadata: { contains: '"page":1' } },
        { metadata: { contains: '"page":2' } },
        { metadata: { contains: '"page":3' } },
        { metadata: { contains: '"page":20' } },
        { metadata: { contains: '"page":30' } },
      ]
    },
    take: 5
  });
  revista.forEach(c => {
    const meta = JSON.parse(c.metadata);
    console.log(`[p.${meta.page}]: ${c.content.substring(0, 200)}...`);
  });
}

main().catch(console.error);
