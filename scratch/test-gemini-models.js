const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    // Note: The SDK might not have a direct listModels, but we can try to fetch it
    // Actually, let's just try to generate a tiny thing with different model names
    const models = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-2.0-flash", "gemini-pro"];
    
    for (const modelName of models) {
      try {
        console.log(`Testing model: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("hi");
        console.log(`  Success! Response: ${result.response.text().substring(0, 10)}...`);
      } catch (e) {
        console.log(`  Failed: ${e.message}`);
      }
    }
  } catch (error) {
    console.error("Error listing/testing models:", error);
  }
}

listModels();
