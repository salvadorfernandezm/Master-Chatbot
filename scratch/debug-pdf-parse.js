const pdf = require("pdf-parse");
console.log("Type of pdf:", typeof pdf);
if (pdf) {
  console.log("Keys of pdf:", Object.keys(pdf));
}
if (typeof pdf.default === 'function') {
    console.log("pdf.default is a function!");
}
if (typeof pdf === 'function') {
    console.log("pdf is a function!");
}
