import Tesseract from 'tesseract.js';
import pdfParse from 'pdf-parse';
import { preprocessText } from '../utils/textPreprocessor';

export async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  let raw: string;

  if (mimeType === 'application/pdf') {
    const data = await pdfParse(buffer);
    raw = data.text;
  } else {
    // JPG / PNG — run Tesseract OCR
    const worker = await Tesseract.createWorker('eng');
    try {
      const { data } = await worker.recognize(buffer);
      raw = data.text;
    } finally {
      await worker.terminate();
    }
  }

  return preprocessText(raw);
}
