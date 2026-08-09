import { Request, Response } from 'express';
import { DocumentModel } from '../models/Document';
import { VerificationModel } from '../models/Verification';
import { runOcr } from '../services/aiService';

export const verifyDocument = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).userId;

  const doc = await DocumentModel.findOne({ _id: req.params.id, userId });
  if (!doc) {
    res.status(404).json({ message: 'Document not found' });
    return;
  }
  if (doc.status === 'processing') {
    res.status(409).json({ message: 'Document is already being processed' });
    return;
  }

  doc.status = 'processing';
  await doc.save();

  try {
    const ocrText = await runOcr(doc.path, doc.mimeType);

    doc.status = 'verified';
    await doc.save();

    const verification = await VerificationModel.create({
      documentId: doc._id,
      userId,
      ocrText,
      charCount: ocrText.length,
      status: 'completed',
    });

    res.json({ verification });
  } catch (err) {
    doc.status = 'failed';
    await doc.save();

    await VerificationModel.create({
      documentId: doc._id,
      userId,
      ocrText: '',
      charCount: 0,
      status: 'failed',
    });

    console.error('Verification error:', err);
    res.status(502).json({ message: 'AI service unavailable or OCR failed' });
  }
};

export const getVerifications = async (req: Request, res: Response): Promise<void> => {
  const verifications = await VerificationModel.find({ userId: (req as any).userId })
    .sort({ createdAt: -1 })
    .populate('documentId', 'originalName mimeType');
  res.json({ verifications });
};

export const getVerification = async (req: Request, res: Response): Promise<void> => {
  const verification = await VerificationModel.findOne({
    _id: req.params.id,
    userId: (req as any).userId,
  }).populate('documentId', 'originalName mimeType');

  if (!verification) {
    res.status(404).json({ message: 'Verification not found' });
    return;
  }

  res.json({ verification });
};
