// @ts-nocheck
if (typeof global.DOMMatrix === 'undefined') {
  global.DOMMatrix = class DOMMatrix { constructor() {} };
}

import * as mammoth from "mammoth";
import * as XLSX from "xlsx";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { prisma } from "./prisma";

const pdfLib = require("pdf-parse");

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000, // Fragmentos más pequeños = más precisión
  chunkOverlap: 100,
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

  console.log(`🚀 Misión: Procesar ${filename} (${fileExtension})`);

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
    // --- LÓGICA REFORZADA PARA EXCEL ---
    else if (fileExtension === "XLSX" || fileExtension === "XLS") {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // Convertimos a CSV (esto nunca falla al extraer texto)
      const csvData = XLSX.utils.sheet_to_csv(firstSheet);
      
      // Separamos por líneas para tener 1 fragmento por alumno
      const lines = csvData.split('\n').filter(line => line.trim().length > 0);
      
      chunks = lines.map((line, index) => new Document({
        pageContent: `REGISTRO ACADÉMICO - FILA ${index + 1}: ${line}`,
        metadata: { source: filename, knowledgeBaseId, documentId, line: index + 1 }
      }));
      
      console.log(`📊 Excel procesado: ${chunks.length} registros de alumnos encontrados.`);
    }
    else if (fileExtension === "TXT") {
      chunks = await textSplitter.createDocuments([buffer.toString('utf-8')], [{ source: filename, knowledgeBaseId, documentId }]);
    }

    if (chunks.length === 0) {
      console.log("⚠️ Atención: El archivo parece no tener texto.");
      return 0;
    }

    console.log(`💾 Indexando ${chunks.length} fragmentos en la Nube...`);
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
    console.error("❌ Fallo en el procesador:", error.message);
    throw error;
  }
}

export async function processUrl() { return 0; }