const { PDFParse } = require('pdf-parse');

async function test() {
    try {
        console.log('Testing with disableWorker: true...');
        const parser = new PDFParse({ 
            data: Buffer.from([]),
            disableWorker: true 
        });
        // We just want to see if it instantiates and prepares the loading task
        console.log('Parser options:', parser.options);
    } catch (e) {
        console.log('Error:', e.message);
    }
}
test();
