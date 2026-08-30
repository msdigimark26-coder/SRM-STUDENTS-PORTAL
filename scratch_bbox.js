const { createWorker } = require('tesseract.js');

async function testBBox() {
  const worker = await createWorker('eng');
  await worker.setParameters({ tessedit_pageseg_mode: '11' });
  const ret = await worker.recognize('/Users/britto/.gemini/antigravity-ide/brain/ddd2361a-5ef7-4a0d-ae4d-c42051280824/.user_uploaded/media_1788018648069.jpg');
  console.log(Object.keys(ret.data));
  if (ret.data.words) console.log("Words count: " + ret.data.words.length);
  await worker.terminate();
}
testBBox();
