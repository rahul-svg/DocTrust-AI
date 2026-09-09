import Tesseract from 'tesseract.js';
import pdfParse from 'pdf-parse';
import { preprocessText } from '../utils/textPreprocessor';

export async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  let raw: string;

  if (mimeType === 'application/pdf') {
    const data = await pdfParse(buffer);
    raw = data.text;
  } else {
    // JPG / PNG — run Tesseract OCR.
    //
    // `errorHandler` is required: without it tesseract.js rejects the pending
    // promise AND rethrows inside its own message callback, which surfaces as
    // an uncaught exception and takes the whole service down. Supplying a
    // handler suppresses that rethrow and leaves the rejection for us to catch.
    const worker = await Tesseract.createWorker('eng', undefined, {
      errorHandler: (err) => {
        console.error('Tesseract worker error:', err);
      },
    });
    try {
      const { data } = await worker.recognize(buffer);
      raw = data.text;
    } finally {
      await worker.terminate();
    }
  }

  return preprocessText(raw);
}
