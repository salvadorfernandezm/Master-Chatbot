// @ts-nocheck
import * as mammoth from "mammoth";
import * as XLSX from "xlsx";
import pdf from "pdf-parse";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { prisma } from "./prisma";

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 2000,
  chunkOverlap: 400,
});

// --- PROCESADOR DE ARCHIVOS (PDF, EXCEL, WORD, TXT) ---
export async function processFile(
  buffer: Buffer,
  filename: string,
  type: string,
  knowledgeBaseId: string,
  documentId: string
) {
  let chunks: Document[] = [];
  const { getEmbeddingsForTexts, addDocumentsToStore } = require("./vectorStore");
  const fileExtension = filename.split('.').pop()?.toUpperCase();

  console.log(`📂 Procesando archivo: ${filename}`);

  try {
    if (fileExtension === "PDF") {
      const data = await pdf(buffer);
      const text = data.text;
      if (text && text.trim().length > 0) {
        chunks = await textSplitter.createDocuments([text], [{ source: filename, knowledgeBaseId, documentId }]);
      }
    } 
    else if (fileExtension === "XLSX" || fileExtension === "XLS") {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const excelBlocks: string[] = [];
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "0" });
        jsonData.forEach((row: any) => {
          let rowString = `FICHA DE CALIFICACIÓN OFICIAL - Alumno: ${row["Nombre"] || row["ALUMNO"] || "Estudiante"}\n`;
          Object.entries(row).forEach(([key, value]) => {
            rowString += `${key}: ${value} | `;
          });
          excelBlocks.push(rowString);
        });
      });
      chunks = await textSplitter.createDocuments(excelBlocks, [{ source: filename, knowledgeBaseId, documentId }]);
    }
    else if (fileExtension === "TXT") {
      const text = buffer.toString('utf-8');
      chunks = await textSplitter.createDocuments([text], [{ source: filename, knowledgeBaseId, documentId }]);
    }
    else if (fileExtension === "DOCX") {
      const result = await mammoth.extractRawText({ buffer });
      chunks = await textSplitter.createDocuments([result.value], [{ source: filename, knowledgeBaseId, documentId }]);
    }

    if (chunks.length === 0) return 0;

    console.log(`💾 Indexando ${chunks.length} fragmentos...`);
    const BATCH_SIZE = 100;
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
      await addDocumentsToStore(batch);
    }
    return chunks.length;
  } catch (error) {
    console.error("❌ Error en processFile:", error);
    throw error;
  }
}

// --- PROCESADOR DE ENLACES WEB (La que faltaba) ---
export async function processUrl(url: string, knowledgeBaseId: string, documentId: string) {
  const { addDocumentsToStore } = require("./vectorStore");
  try {
    const res = await fetch(url);
    const html = await res.text();
    // Limpieza básica de HTML
    const cleanHtml = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]*>?/gm, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const chunks = await textSplitter.createDocuments([cleanHtml], [{ source: url, knowledgeBaseId, documentId }]);
    await addDocumentsToStore(chunks);

    await prisma.documentChunk.createMany({
      data: chunks.map(c => ({
        content: c.pageContent,
        metadata: JSON.stringify(c.metadata),
        documentId: documentId,
        knowledgeBaseId: knowledgeBaseId
      }))
    });
    return chunks.length;
  } catch (error) {
    console.error("❌ Error en processUrl:", error);
    throw error;
  }
}