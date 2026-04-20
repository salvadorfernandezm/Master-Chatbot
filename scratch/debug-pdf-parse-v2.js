const { PDFParse } = require("pdf-parse");
console.log("Type of PDFParse:", typeof PDFParse);
// Let's also check if there are other functions
const pdf = require("pdf-parse");
for (const key of Object.keys(pdf)) {
  console.log(`${key}: ${typeof pdf[key]}`);
}
