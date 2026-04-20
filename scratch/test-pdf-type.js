const pdf = require('pdf-parse');
const PDFParse = pdf.PDFParse;

console.log('PDFParse type:', typeof PDFParse);
// Just to be sure, check if it's a class or function
try {
    const result = PDFParse(Buffer.from([]));
    console.log('Called as function successfully (passed empty buffer)');
} catch (e) {
    console.log('Error calling as function:', e.message);
    try {
        const instance = new PDFParse(Buffer.from([]));
        console.log('Instantiated successfully as class');
    } catch (e2) {
        console.log('Error instantiating as class:', e2.message);
    }
}
