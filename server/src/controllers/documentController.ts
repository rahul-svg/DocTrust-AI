import { Request, Response } from 'express';
import fs from 'fs';
import { DocumentModel } from '../models/Document';

export const uploadDocument = async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ message: 'No file uploaded' });
    return;
  }

  const doc = await DocumentModel.create({
    userId: (req as any).userId,
    originalName: req.file.originalname,
    fileName: req.file.filename,
    mimeType: req.file.mimetype,
    size: req.file.size,
    path: req.file.path,
    status: 'pending',
  });

  res.status(201).json({ document: doc });
};

export const getDocuments = async (req: Request, res: Response): Promise<void> => {
  const docs = await DocumentModel.find({ userId: (req as any).userId })
    .sort({ createdAt: -1 })
    .select('-path');
  res.json({ documents: docs });
};

export const getDocument = async (req: Request, res: Response): Promise<void> => {
  const doc = await DocumentModel.findOne({
    _id: req.params.id,
    userId: (req as any).userId,
  }).select('-path');

  if (!doc) {
    res.status(404).json({ message: 'Document not found' });
    return;
  }

  res.json({ document: doc });
};

export const deleteDocument = async (req: Request, res: Response): Promise<void> => {
  const doc = await DocumentModel.findOne({
    _id: req.params.id,
    userId: (req as any).userId,
  });

  if (!doc) {
    res.status(404).json({ message: 'Document not found' });
    return;
  }

  // Remove file from disk
  fs.unlink(doc.path, () => {});
  await doc.deleteOne();

  res.json({ message: 'Document deleted' });
};
