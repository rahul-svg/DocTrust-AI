import { Request, Response } from 'express';
import { analyzeDocument } from '../services/aiAnalyzer';
import { classifyDocument } from '../services/documentClassifier';

export const processVerify = async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ message: 'No file provided' });
    return;
  }
  try {
    const result = await analyzeDocument(req.file.buffer, req.file.mimetype);
    res.json(result);
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ message: 'AI analysis failed' });
  }
};

export const processClassify = async (req: Request, res: Response): Promise<void> => {
  const text: string | undefined = req.body?.text;
  if (!text || typeof text !== 'string') {
    res.status(400).json({ message: '"text" string field is required' });
    return;
  }
  try {
    const result = await classifyDocument(text);
    res.json(result);
  } catch (err) {
    console.error('Classify error:', err);
    res.status(500).json({ message: 'Classification failed' });
  }
};
