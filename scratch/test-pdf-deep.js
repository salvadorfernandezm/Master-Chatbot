const pdf = require('pdf-parse');
console.log('All properties of require("pdf-parse"):');
console.log(Object.getOwnPropertyNames(pdf));
console.log('Is PDFParse a prototype or a function?');
console.log('typeof PDFParse:', typeof pdf.PDFParse);
if (pdf.PDFParse) {
    console.log('PDFParse string representation:', pdf.PDFParse.toString().substring(0, 100));
}
