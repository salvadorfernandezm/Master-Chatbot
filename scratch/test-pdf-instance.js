const { PDFParse } = require('pdf-parse');

async function test() {
    try {
        console.log('Instantiating PDFParse...');
        // We'll use a dummy buffer.
        const instance = new PDFParse(Buffer.from([]));
        console.log('Instance keys:', Object.keys(instance));
        console.log('Instance constructor name:', instance.constructor.name);
        
        // Let's see if it's a promise or has a then method
        if (instance.then) {
            console.log('Instance is thenable (Promise-like)');
        }
    } catch (e) {
        console.log('Error:', e.message);
    }
}
test();
