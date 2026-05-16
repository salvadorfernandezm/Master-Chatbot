// @ts-nocheck

// PARCHE PARA VERCEL (DOMMatrix y otros)
if (typeof global.DOMMatrix === 'undefined') {
  global.DOMMatrix = class DOMMatrix { constructor() {} };
}

// PROCESADOR DE ARCHIVOS (PDF, WORD, EXCEL)
export async function processFile(
  buffer: Buffer,
  filename: string,
  type: string,
  knowledgeBaseId: string,
  documentId: string
) {
  // CARGA DINÁMICA (LAZY LOADING) para que Vercel no se asuste al abrir la web
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

    // GUARDAR EN BASE DE DATOS
    const BATCH_SIZE = 50; 
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
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
    console.error("Fallo en proceso de archivo:", error.message);
    throw error;
  }
}

// CORRECCIÓN: Función con los 3 argumentos que pide admin.ts
export async function processUrl(url: string, knowledgeBaseId: string, documentId: string) {
    console.log(`🌐 Intento de procesar URL: ${url}`);
    // Se deja vacía por ahora para evitar problemas de Build en Vercel
    return 0;
}