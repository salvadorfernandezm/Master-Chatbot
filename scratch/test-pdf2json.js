const PDFParser = require("pdf2json");

async function testExtraction() {
  const pdfParser = new PDFParser(null, 1); // 1 = text only

  pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError));
  pdfParser.on("pdfParser_dataReady", pdfData => {
    let rawText = "";
    pdfData.Pages.forEach(page => {
      page.Texts.forEach(text => {
        text.R.forEach(r => {
          rawText += decodeURIComponent(r.T);
        });
        rawText += " ";
      });
      rawText += "\n";
    });
    console.log("Extracted text sample (first 100 chars):", rawText.substring(0, 100));
  });

  // We'll just test if it instantiates and defines events
  console.log("PDFParser instantiated successfully");
}

testExtraction();
