// @ts-nocheck
if (typeof global.DOMMatrix === 'undefined') {
  (global as any).DOMMatrix = class DOMMatrix {};
}

import * as mammoth from "mammoth";
import * as XLSX from "xlsx";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { prisma } from "./prisma";

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 4000,
  chunkOverlap: 800,
});

const mammothOptions = {
  ignoreEmptyParagraphs: true,
  convertImage: mammoth.images.imgElement(() => {
    return { src: "" };
  })
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function processFile(
  buffer: Buffer,
  filename: string,
  type: string,
  knowledgeBaseId: string,
  documentId: string,
  skipPages: number = 0
) {
  let chunks: Document[] = [];
  const { getEmbeddingsForTexts, addDocumentsToStore } = require("./vectorStore");
  const fileExtension = filename.split('.').pop()?.toUpperCase();

  console.log(`📂 Procesando archivo: ${filename} (Ext: ${fileExtension})`);

  try {
    // --- RAMA 1: EXCEL (Versión Blindada v3) ---
    if (fileExtension === "XLSX" || fileExtension === "XLS") {
      console.log(`📊 Procesando Calificaciones: ${filename}`);
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "0" });
        
        for (const row of jsonData) {
          const alumno = row["Nombre"] || row["ALUMNO"] || "Estudiante";
          
          let fichaData = `FICHA DE CALIFICACIÓN OFICIAL\n`;
          fichaData += `ESTUDIANTE: ${alumno}\n`;
          fichaData += `DATOS EXTRAÍDOS DEL ARCHIVO: ${filename}\n`;
          fichaData += `----------------------------------\n`;
          
          Object.entries(row).forEach(([actividad, nota]) => {
            if (actividad !== "Nombre" && actividad !== "ALUMNO") {
              fichaData += `CALIFICACIÓN EN ${actividad}: ${nota}\n`;
            }
          });
          fichaData += `----------------------------------`;

          const doc = new Document({
            pageContent: fichaData,
            metadata: { source: filename, student: alumno, knowledgeBaseId, documentId }
          });
          chunks.push(doc);
        }
      }
    }
    // --- RAMA 2: TEXTO PLANO ---
    else if (fileExtension === "TXT") {
      console.log(`📄 Extrayendo texto plano...`);
      const text = buffer.toString('utf-8');
      chunks = await textSplitter.createDocuments([text], [{ source: filename, knowledgeBaseId, documentId }]);
    } 
    // --- RAMA 3: PDF ---
    else if (fileExtension === "PDF" || type === "PDF") {
      const { PDFParse } = require("pdf-parse");
      const parser = new PDFParse({ data: buffer, verbosity: 0 });
      const result = await parser.getText();
      const pagesData = result.pages.map(p => ({ text: p.text, pageNumber: p.num }));
      await parser.destroy();

      pagesData.sort((a, b) => a.pageNumber - b.pageNumber);
      const rawPages = pagesData.slice(skipPages);
      
      for (const page of rawPages) {
        if (!page.text.trim()) continue;
        const pageChunks = await textSplitter.createDocuments(
          [page.text],
          [{ source: filename, page: page.pageNumber, knowledgeBaseId, documentId }]
        );
        chunks.push(...pageChunks);
      }
    } 
    // --- RAMA 4: WORD ---
    else if (fileExtension === "DOCX" || type === "WORD") {
      const result = await mammoth.convertToHtml({ buffer }, mammothOptions);
      const cleanText = result.value.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
      chunks = await textSplitter.createDocuments([cleanText], [{ source: filename, knowledgeBaseId, documentId }]);
    }

    // --- GUARDADO E INDEXACIÓN ---
    if (chunks.length === 0) {
      console.warn("⚠️ No se generaron fragmentos del archivo.");
      return 0;
    }

    console.log(`💾 Indexando ${chunks.length} fragmentos...`);
    const BATCH_SIZE = 100;
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      let embeddings: number[][] = [];
      let success = false;
      let retries = 0;

      while (!success && retries < 5) {
        try {
          embeddings = await getEmbeddingsForTexts(batch.map(c => c.pageContent));
          success = true;
        } catch (err) {
          retries++;
          await sleep(2000 * retries);
        }
      }

      if (success) {
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
    }
    return chunks.length;

  } catch (error) {
    console.error("❌ Error procesando archivo:", error);
    throw error;
  }
}

export async function processUrl(url: string, knowledgeBaseId: string, documentId: string) {
  const { addDocumentsToStore } = require("./vectorStore");
  const res = await fetch(url);
  const html = await res.text();
  const cleanHtml = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '').replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
  const chunks = await textSplitter.createDocuments([cleanHtml], [{ source: url, knowledgeBaseId, documentId }]);
  await addDocumentsToStore(chunks);
  return chunks.length;
}