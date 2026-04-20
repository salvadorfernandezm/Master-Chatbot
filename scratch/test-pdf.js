const pdf = require('pdf-parse');
console.log('Type of pdf-parse:', typeof pdf);
console.log('Keys of pdf-parse:', Object.keys(pdf));
if (pdf.default) {
    console.log('Type of pdf-parse.default:', typeof pdf.default);
}
