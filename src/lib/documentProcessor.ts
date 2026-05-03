// @ts-nocheck
if (typeof global.DOMMatrix === 'undefined') {
  global.DOMMatrix = class DOMMatrix { constructor() {} };
}

import * as mammoth from "mammoth";
import * as XLSX from "xlsx";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { prisma } from "./prisma";

// Importación de librería PDF
const pdfLib = require("pdf-parse");

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 2000,
  chunkOverlap: 400,
});

export async function processFile(
  buffer: Buffer,
  filename: string,
  type: string,
  knowledgeBaseId: string,
  documentId: string
) {
  let chunks: Document[] = [];
  const { getEmbeddingsForTexts } = require("./vectorStore");
  const fileExtension = filename.split('.').pop()?.toUpperCase();

  console.log(`📂 Misión: Procesar ${filename} (${fileExtension})`);

  try {
    if (fileExtension === "PDF") {
      const PDFParse = pdfLib.PDFParse || pdfLib;
      const parser = new PDFParse({ data: buffer, verbosity: 0 });
      const result = await parser.getText();
      const text = result.pages.map(p => p.text).join("\n");
      if (text.trim()) {
        chunks = await textSplitter.createDocuments([text], [{ source: filename, knowledgeBaseId, documentId }]);
      }
    } 
    else if (fileExtension === "XLSX" || fileExtension === "XLS") {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      let fullText = "";
      workbook.SheetNames.forEach(sheet => {
        fullText += XLSX.utils.sheet_to_csv(workbook.Sheets[sheet]);
      });
      chunks = await textSplitter.createDocuments([fullText], [{ source: filename, knowledgeBaseId, documentId }]);
    }
    else if (fileExtension === "DOCX") {
      const result = await mammoth.extractRawText({ buffer });
      if (result.value) {
        chunks = await textSplitter.createDocuments([result.value], [{ source: filename, knowledgeBaseId, documentId }]);
      }
    }

    if (chunks.length === 0) return 0;

    console.log(`💾 Indexando ${chunks.length} fragmentos...`);
    const BATCH_SIZE = 50; 
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const embeddings = await getEmbeddingsForTexts(batch.map(c => c.pageContent));
      await prisma.documentChunk.createMany({
        data: batch.map((c, idx) => ({
          content: c.pageContent,
          metadata: JSON.stringify(c.metadata),
          embedding: JSON.stringify(embeddings[idx]),
          documentId: documentId,
          knowledgeBaseId: knowledgeBaseId
        }))
      });
    }
    return chunks.length;
  } catch (error) {
    console.error("❌ ERROR EN PROCESADOR:", error.message);
    throw error;
  }
}

// CORRECCIÓN: Ahora la función acepta los 3 argumentos requeridos por admin.ts
export async function processUrl(url: string, knowledgeBaseId: string, documentId: string) {
    console.log(`🌐 Procesando URL: ${url}`);
    return 0; 
}