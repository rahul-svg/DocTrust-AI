import { Request, Response } from 'express';
import { extractText } from '../services/ocr';

export const processOcr = async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ message: 'No file provided' });
    return;
  }

  try {
    const text = await extractText(req.file.buffer, req.file.mimetype);
    res.json({ text, charCount: text.length });
  } catch (err) {
    console.error('OCR error:', err);
    res.status(500).json({ message: 'OCR processing failed' });
  }
};
