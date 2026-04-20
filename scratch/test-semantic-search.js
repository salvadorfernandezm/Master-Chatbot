const { searchVectorStore, addDocumentsToStore } = require("./src/lib/vectorStore");
const { Document } = require("@langchain/core/documents");
const dotenv = require("dotenv");
dotenv.config();

async function testSemanticSearch() {
  try {
    console.log("Starting semantic search test...");
    
    // Mock documents
    const docs = [
      new Document({ 
        pageContent: "Para citar una revista en formato APA 7, debes incluir el autor, año, título del artículo, nombre de la revista, volumen, número y páginas.",
        metadata: { knowledgeBaseId: "test-kb", source: "APA Manual" }
      }),
      new Document({ 
        pageContent: "Las hamburguesas son un alimento popular en todo el mundo.",
        metadata: { knowledgeBaseId: "test-kb", source: "Culinaria" }
      })
    ];

    await addDocumentsToStore(docs);

    const query = "revistas indexadas";
    console.log(`Searching for: "${query}"...`);
    const results = await searchVectorStore(query, "test-kb");

    console.log(`Found ${results.length} relevant fragments.`);
    results.forEach((r, i) => {
      console.log(`Match ${i+1}: ${r.pageContent.substring(0, 100)}...`);
    });

  } catch (error) {
    console.error("Test failed:", error);
  }
}

testSemanticSearch();
