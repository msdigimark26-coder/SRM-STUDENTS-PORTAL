const { createWorker } = require('tesseract.js');
const fs = require('fs');

async function testCell() {
  const worker = await createWorker('eng');
  await worker.setParameters({ tessedit_pageseg_mode: '10' }); // PSM 10: Treat image as a single character
  // Just testing the initialization
  console.log("Worker ready for single char");
  await worker.terminate();
}
testCell();
