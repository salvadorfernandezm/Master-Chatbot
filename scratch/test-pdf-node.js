try {
    const pdf = require('pdf-parse/node');
    console.log('Type of pdf-parse/node:', typeof pdf);
    console.log('Keys of pdf-parse/node:', Object.keys(pdf));
} catch (e) {
    console.log('Error requiring pdf-parse/node:', e.message);
}

try {
    const pdf = require('pdf-parse');
    console.log('Type of pdf-parse (checking PDFParse property):', typeof pdf.PDFParse);
} catch (e) {
    console.log('Error checking PDFParse property:', e.message);
}
