const { createWorker } = require('tesseract.js');
const fs = require('fs');

async function testDump() {
  const worker = await createWorker('eng');
  const ret = await worker.recognize('/Users/britto/.gemini/antigravity-ide/brain/ddd2361a-5ef7-4a0d-ae4d-c42051280824/.user_uploaded/media_1788018648069.jpg');
  
  // Dump everything except the huge images
  const out = { ...ret.data };
  delete out.imageColor;
  delete out.imageGrey;
  delete out.imageBinary;
  
  fs.writeFileSync('ocr_data.json', JSON.stringify(out, null, 2));
  await worker.terminate();
}
testDump();
