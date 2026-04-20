const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listAllModels() {
  try {
    // In @google/generative-ai, there isn't a direct top-level listModels, 
    // it's part of the API. We can use fetch directly to the models endpoint.
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.models) {
      console.log("Available models:");
      data.models.forEach(m => console.log(`- ${m.name} (supports: ${m.supportedGenerationMethods})`));
    } else {
      console.log("No models found or error:", data);
    }
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

listAllModels();
