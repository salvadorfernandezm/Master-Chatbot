const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkDocs() {
  const docs = await prisma.document.findMany();
  console.log("Documents in DB:", JSON.stringify(docs, null, 2));
  process.exit(0);
}

checkDocs();
