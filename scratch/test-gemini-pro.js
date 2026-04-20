const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config();

// Specify v1 version
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testV1() {
  try {
     console.log("Testing gemini-1.5-flash on DEFAULT version...");
     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
     // Try to call a different method?
     // No, let's try gemini-1.5-pro
     console.log("Testing gemini-1.5-pro...");
     const modelPro = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
     const result = await modelPro.generateContent("hi");
     console.log("Success with 1.5-pro!");
  } catch (e) {
     console.log("Failed:", e.message);
  }
}
testV1();
