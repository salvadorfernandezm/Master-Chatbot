// @ts-nocheck
import * as mammoth from "mammoth";
import * as XLSX from "xlsx";
import pdf from "pdf-parse"; // Forma estándar
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { prisma } from "./prisma";

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
  const { getEmbeddingsForTexts, addDocumentsToStore } = require("./vectorStore");
  const fileExtension = filename.split('.').pop()?.toUpperCase();

  console.log(`📂 Procesando: ${filename} | Tipo detectado: ${fileExtension}`);

  try {
    // --- LÓGICA PARA PDF ---
    if (fileExtension === "PDF") {
      const data = await pdf(buffer);
      const text = data.text;
      if (text && text.trim().length > 0) {
        chunks = await textSplitter.createDocuments([text], [{ source: filename, knowledgeBaseId, documentId }]);
      }
    } 
    // --- LÓGICA PARA EXCEL (Tu favorita de las fichas) ---
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
    // --- LÓGICA PARA TEXTO PLANO ---
    else if (fileExtension === "TXT") {
      const text = buffer.toString('utf-8');
      chunks = await textSplitter.createDocuments([text], [{ source: filename, knowledgeBaseId, documentId }]);
    }

    if (chunks.length === 0) {
      console.error("❌ ERROR: No se extrajo texto del archivo.");
      return 0;
    }

    // --- GUARDADO E INDEXACIÓN ---
    console.log(`💾 Indexando ${chunks.length} fragmentos en Supabase...`);
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
    console.error("❌ Error en el procesador:", error);
    throw error;
  }
}

// (La función processUrl se queda igual que antes abajo)