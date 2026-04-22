// @ts-nocheck
import * as mammoth from "mammoth";
import * as XLSX from "xlsx";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { prisma } from "./prisma";

// Importamos la librería de PDF
const pdf = require("pdf-parse");

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1500,
  chunkOverlap: 300,
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

  console.log(`📂 Iniciando procesamiento: ${filename} (${fileExtension})`);

  try {
    // --- LÓGICA PARA PDF (VERSIÓN TRIPLE INTENTO) ---
    if (fileExtension === "PDF") {
      let data;
      
      console.log("🕵️ Intentando ejecutar extractor de PDF...");
      
      try {
        // Intento 1: Llamada directa
        data = await pdf(buffer);
      } catch (e1) {
        try {
          // Intento 2: Llamada al default (común en Next.js/Turbopack)
          data = await pdf.default(buffer);
        } catch (e2) {
          // Intento 3: Si es un objeto con la función dentro
          if (typeof pdf === 'object' && pdf !== null) {
            const keys = Object.keys(pdf);
            console.log("🔍 Estructura de la librería detectada:", keys);
            // Si hay una función disponible en el objeto, la usamos
            const func = pdf[keys[0]]; 
            if (typeof func === 'function') data = await func(buffer);
            else throw new Error("No se encontró una función válida en la librería PDF.");
          } else {
            throw new Error("La librería PDF no se cargó correctamente.");
          }
        }
      }

      const text = data?.text?.trim();
      
      if (text && text.length > 10) {
        console.log(`✅ PDF leído con éxito: ${text.length} caracteres.`);
        chunks = await textSplitter.createDocuments([text], [{ source: filename, knowledgeBaseId, documentId }]);
      } else {
        console.warn("⚠️ El PDF no devolvió texto. ¿Es una imagen?");
        return 0;
      }
    } 
    // --- LÓGICA PARA EXCEL ---
    else if (fileExtension === "XLSX" || fileExtension === "XLS") {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const excelBlocks: string[] = [];
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "0" });
        jsonData.forEach((row: any) => {
          let rowString = `FICHA DE CALIFICACIÓN OFICIAL - Alumno: ${row["Nombre"] || row["ALUMNO"] || "Estudiante"}\n`;
          Object.entries(row).forEach(([key, value]) => { rowString += `${key}: ${value} | `; });
          excelBlocks.push(rowString);
        });
      });
      chunks = await textSplitter.createDocuments(excelBlocks, [{ source: filename, knowledgeBaseId, documentId }]);
    }
    // --- LÓGICA PARA TXT ---
    else if (fileExtension === "TXT") {
      const text = buffer.toString('utf-8');
      chunks = await textSplitter.createDocuments([text], [{ source: filename, knowledgeBaseId, documentId }]);
    }
    // --- LÓGICA PARA WORD ---
    else if (fileExtension === "DOCX") {
      const result = await mammoth.extractRawText({ buffer });
      chunks = await textSplitter.createDocuments([result.value], [{ source: filename, knowledgeBaseId, documentId }]);
    }

    if (chunks.length === 0) return 0;

    // --- INDEXACIÓN EN SUPABASE ---
    console.log(`💾 Indexando ${chunks.length} fragmentos en la Nube...`);
    const BATCH_SIZE = 40; 
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
    console.error("❌ Error fatal en el procesador:", error.message);
    throw error;
  }
}

// --- PROCESADOR DE ENLACES WEB ---
export async function processUrl(url: string, knowledgeBaseId: string, documentId: string) {
  const { addDocumentsToStore } = require("./vectorStore");
  try {
    const res = await fetch(url);
    const html = await res.text();
    const cleanHtml = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '').replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
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
    console.error("❌ Error en processUrl:", error.message);
    throw error;
  }
}