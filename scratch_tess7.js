const { createWorker } = require('./frontend/node_modules/tesseract.js');
const fs = require('fs');

async function testTess() {
  const worker = await createWorker('eng');
  const ret = await worker.recognize('/Users/britto/.gemini/antigravity-ide/brain/ddd2361a-5ef7-4a0d-ae4d-c42051280824/.user_uploaded/media_1788018648069.jpg');
  
  if (ret.data.words) {
    console.log("Words found: " + ret.data.words.length);
    fs.writeFileSync('words.json', JSON.stringify(ret.data.words.map(w => ({ text: w.text, bbox: w.bbox })), null, 2));
  } else {
    console.log("No words object in ret.data");
    console.log(Object.keys(ret.data));
  }
  await worker.terminate();
}
testTess();
