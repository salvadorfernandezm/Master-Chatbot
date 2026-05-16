// @ts-nocheck

// Parche de seguridad para que la web cargue fluida
if (typeof global.DOMMatrix === 'undefined') {
  global.DOMMatrix = class DOMMatrix { constructor() {} };
}

export async function processFile(
  buffer: Buffer,
  filename: string,
  type: string,
  knowledgeBaseId: string,
  documentId: string
) {
  // CARGA EN CALIENTE: Las librerías pesadas solo se cargan AQUÍ adentro
  const pdfLib = require("pdf-parse");
  const mammoth = require("mammoth");
  const XLSX = require("xlsx");
  const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
  // Nota el .default o la importación directa para evitar el fallo
  const vectorStore = await import("./vectorStore");

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1500,
    chunkOverlap: 200,
  });

  const fileExtension = filename.split('.').pop()?.toUpperCase();
  let chunks = [];

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
      const embeddings = await vectorStore.getEmbeddingsForTexts(batch.map((c: any) => c.pageContent));
      const { prisma } = await import("./prisma");
      await prisma.documentChunk.createMany({
        data: batch.map((c: any, idx: number) => ({
          content: c.pageContent,
          metadata: JSON.stringify(c.metadata),
          embedding: JSON.stringify(embeddings[idx]),
          documentId,
          knowledgeBaseId
        }))
      });
    }
    return chunks.length;
  } catch (error: any) {
    console.error("Error procesador:", error.message);
    throw error;
  }
}

export async function processUrl(url: string, kbId: string, docId: string) { return 0; }