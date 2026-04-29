// @ts-nocheck

/** 
 * PARCHE DE COMPATIBILIDAD PARA VERCEL
 * Esto evita los errores de DOMMatrix, ImageData y Path2D que bloquean el servidor
 */
if (typeof global.window === 'undefined') {
  global.window = {} as any;
}
if (typeof global.DOMMatrix === 'undefined') {
  global.DOMMatrix = class DOMMatrix {
    constructor() {}
    static fromFloat32Array() { return new DOMMatrix(); }
    static fromFloat64Array() { return new DOMMatrix(); }
  };
}
if (typeof global.ImageData === 'undefined') {
  global.ImageData = class ImageData { constructor() {} };
}

import * as mammoth from "mammoth";
import * as XLSX from "xlsx";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { prisma } from "./prisma";

// Importación de la librería de PDF
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

  try {
    if (fileExtension === "PDF") {
      const PDFParse = pdfLib.PDFParse || pdfLib;
      const parser = new PDFParse({ data: buffer, verbosity: 0 });
      const result = await parser.getText();
      const text = result.pages.map(p => p.text).join("\n");
      if (text) chunks = await textSplitter.createDocuments([text], [{ source: filename, knowledgeBaseId, documentId }]);
    } 
    else if (fileExtension === "DOCX") {
      const result = await mammoth.extractRawText({ buffer });
      if (result.value) chunks = await textSplitter.createDocuments([result.value], [{ source: filename, knowledgeBaseId, documentId }]);
    }
    else if (fileExtension === "XLSX" || fileExtension === "XLS") {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      let excelText = "";
      workbook.SheetNames.forEach(sheet => {
        excelText += XLSX.utils.sheet_to_csv(workbook.Sheets[sheet]);
      });
      chunks = await textSplitter.createDocuments([excelText], [{ source: filename, knowledgeBaseId, documentId }]);
    }
    else if (fileExtension === "TXT") {
      chunks = await textSplitter.createDocuments([buffer.toString('utf-8')], [{ source: filename, knowledgeBaseId, documentId }]);
    }

    if (chunks.length === 0) return 0;

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
    console.error("❌ Error en procesador:", error.message);
    throw error;
  }
}

export async function processUrl(url: string, knowledgeBaseId: string, documentId: string) {
    return 0;
}