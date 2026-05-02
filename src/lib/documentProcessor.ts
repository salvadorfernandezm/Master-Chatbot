// @ts-nocheck
/** 
 * PARCHE DE COMPATIBILIDAD PARA VERCEL
 */
if (typeof global.DOMMatrix === 'undefined') {
  global.DOMMatrix = class DOMMatrix {
    constructor() { }
    static fromFloat32Array() { return new DOMMatrix(); }
    static fromFloat64Array() { return new DOMMatrix(); }
  };
}

import * as mammoth from "mammoth";
import * as XLSX from "xlsx";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { prisma } from "./prisma";

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

  console.log(`📂 Iniciando procesamiento: ${filename} (${fileExtension})`);

  try {
    // --- LÓGICA PARA PDF ---
    if (fileExtension === "PDF") {
      const PDFParse = pdfLib.PDFParse || pdfLib;
      const parser = new PDFParse({ data: buffer, verbosity: 0 });
      const result = await parser.getText();
      const text = result.pages.map(p => p.text).join("\n");
      if (text) chunks = await textSplitter.createDocuments([text], [{ source: filename, knowledgeBaseId, documentId }]);
    } 
    // --- LÓGICA PARA WORD ---
    else if (fileExtension === "DOCX") {
      const result = await mammoth.extractRawText({ buffer });
      if (result.value) chunks = await textSplitter.createDocuments([result.value], [{ source: filename, knowledgeBaseId, documentId }]);
    }
    // --- LÓGICA PARA EXCEL (RESTAURADA VERSIÓN DE ALTA PRECISIÓN) ---
    else if (fileExtension === "XLSX" || fileExtension === "XLS") {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const excelBlocks: string[] = [];

      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        
        jsonData.forEach((row: any) => {
          // Convertimos cada fila en una ficha súper clara
          let rowString = `FICHA DE CALIFICACIÓN OFICIAL\n`;
          Object.entries(row).forEach(([key, value]) => {
            rowString += `${key}: ${value}\n`; // Usamos saltos de línea para que Gemini lo lea mejor
          });
          excelBlocks.push(rowString);
        });
      });

      // Creamos un documento por cada ficha de alumno
      chunks = await textSplitter.createDocuments(excelBlocks, [{ source: filename, knowledgeBaseId, documentId }]);
      console.log(`✅ Excel transformado en ${chunks.length} fichas individuales.`);
    }
    // --- LÓGICA PARA TXT ---
    else if (fileExtension === "TXT") {
      chunks = await textSplitter.createDocuments([buffer.toString('utf-8')], [{ source: filename, knowledgeBaseId, documentId }]);
    }

    if (chunks.length === 0) return 0;

    console.log(`💾 Indexando ${chunks.length} fragmentos en la Base de Datos...`);
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