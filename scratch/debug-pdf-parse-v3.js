const { PDFParse } = require("pdf-parse");
console.log("PDFParse prototype:", Object.keys(PDFParse.prototype));
console.log("PDFParse static keys:", Object.keys(PDFParse));

try {
  // Test if it has a static method
  console.log("Is there a static parse method?", typeof PDFParse.parse);
} catch (e) {}
