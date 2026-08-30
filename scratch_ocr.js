const { createWorker } = require('tesseract.js');
const fs = require('fs');

async function testOCR() {
  const worker = await createWorker('eng');
  await worker.setParameters({
    tessedit_pageseg_mode: '6',
  });
  const ret = await worker.recognize('/Users/britto/.gemini/antigravity-ide/brain/ddd2361a-5ef7-4a0d-ae4d-c42051280824/.user_uploaded/media_1788018648069.jpg');
  fs.writeFileSync('ocr_output_psm6.txt', ret.data.text);
  await worker.terminate();
  console.log("Done");
}
testOCR();
