const { PDFParse } = require('pdf-parse');
const fs = require('fs');

async function test() {
    console.log('Testing PDFParse function...');
    // We don't have a real pdf buffer here easily without a file, 
    // but we can check if it's a function and what its signature might be.
    console.log('PDFParse is:', typeof PDFParse);
}
test();
