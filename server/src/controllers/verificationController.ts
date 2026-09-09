import { Request, Response } from 'express';
import { DocumentModel } from '../models/Document';
import { VerificationModel } from '../models/Verification';
import { runFullVerification } from '../services/aiService';

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
    const result = await runFullVerification(doc.path, doc.mimeType);

    doc.status = result.status === 'failed' ? 'failed' : 'verified';
    await doc.save();

    const verification = await VerificationModel.create({
      documentId: doc._id,
      userId,
      ocrText: result.ocrText,
      charCount: result.ocrText.length,
      documentType: result.documentType,
      confidence: result.confidence,
      extractedData: result.extractedData,
      aiAnalysis: result.aiAnalysis,
      issues: result.issues,
      status: result.status,
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
      documentType: 'unknown',
      confidence: 0,
      extractedData: {},
      aiAnalysis: {
        documentQuality: 'Poor',
        tamperingDetected: false,
        dataConsistency: false,
        riskScore: 0,
        anomalies: [],
      },
      issues: ['AI service unavailable or processing failed'],
      status: 'failed',
    });

    console.error('Verification error:', err);
    res.status(502).json({ message: 'AI service unavailable or processing failed' });
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
