// @ts-nocheck
// Eliminamos el require de arriba para que Vercel no se asuste al abrir la web

export async function processFile(
  buffer: Buffer,
  filename: string,
  type: string,
  knowledgeBaseId: string,
  documentId: string
) {
  // LA MAGIA: Solo cargamos las librerías pesadas CUANDO se ejecuta esta función
  const pdfLib = require("pdf-parse");
  const mammoth = require("mammoth");
  const XLSX = require("xlsx");
  const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
  const { getEmbeddingsForTexts } = require("./vectorStore");
  const { prisma } = require("./prisma");

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 2000,
    chunkOverlap: 400,
  });

  const fileExtension = filename.split('.').pop()?.toUpperCase();
  let chunks: any[] = [];

  try {
    if (fileExtension === "PDF") {
      const PDFParse = pdfLib.PDFParse || pdfLib;
      const parser = new PDFParse({ data: buffer, verbosity: 0 });
      const result = await parser.getText();
      const text = result.pages.map((p: any) => p.text).join("\n");
      if (text) chunks = await textSplitter.createDocuments([text], [{ source: filename, knowledgeBaseId, documentId }]);
    } 
    else if (fileExtension === "XLSX" || fileExtension === "XLS") {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      let excelText = "";
      workbook.SheetNames.forEach((sheet: string) => {
        excelText += XLSX.utils.sheet_to_csv(workbook.Sheets[sheet]);
      });
      chunks = await textSplitter.createDocuments([excelText], [{ source: filename, knowledgeBaseId, documentId }]);
    }
    else if (fileExtension === "DOCX") {
      const result = await mammoth.extractRawText({ buffer });
      if (result.value) chunks = await textSplitter.createDocuments([result.value], [{ source: filename, knowledgeBaseId, documentId }]);
    }

    if (chunks.length === 0) return 0;

    for (let i = 0; i < chunks.length; i += 50) {
      const batch = chunks.slice(i, i + 50);
      const embeddings = await getEmbeddingsForTexts(batch.map((c: any) => c.pageContent));
      await prisma.documentChunk.createMany({
        data: batch.map((c: any, idx: number) => ({
          content: c.pageContent,
          metadata: JSON.stringify(c.metadata),
          embedding: JSON.stringify(embeddings[idx]),
          documentId: documentId,
          knowledgeBaseId: knowledgeBaseId
        }))
      });
    }
    return chunks.length;
  } catch (error: any) {
    console.error("Error:", error.message);
    throw error;
  }
}

export async function processUrl() { return 0; }