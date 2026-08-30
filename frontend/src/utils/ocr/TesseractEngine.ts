import Tesseract from 'tesseract.js';
import type { IOcrEngine } from './TimetableParser';

export class TesseractEngine implements IOcrEngine {
  private preprocessImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Scale up by 2x for better OCR
        const scale = 2;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Canvas 2D context not available'));
        }

        // Draw and scale
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Binarization (thresholding)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // Simple grayscale and threshold
          const v = (0.2126 * r + 0.7152 * g + 0.0722 * b >= 140) ? 255 : 0;
          data[i] = data[i + 1] = data[i + 2] = v;
          data[i + 3] = 255; // Fully opaque
        }
        ctx.putImageData(imageData, 0, 0);

        // Get processed image data URL
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('Failed to load image for preprocessing'));
      img.src = URL.createObjectURL(file);
    });
  }

  async extractText(file: File): Promise<string> {
    try {
      // 1. Preprocess the image using Canvas (Scale up + Thresholding)
      const processedImageUrl = await this.preprocessImage(file);
      
      // 2. Run Tesseract on the processed image
      const result = await Tesseract.recognize(
        processedImageUrl,
        'eng',
        {
          logger: m => console.log(`[OCR] ${m.status}: ${Math.round(m.progress * 100)}%`)
        }
      );
      
      return result.data.text;
    } catch (error) {
      console.error('[OCR Engine] Error extracting text:', error);
      throw error;
    }
  }
}
