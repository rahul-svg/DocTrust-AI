import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAiAnalysis {
  documentQuality: 'Good' | 'Fair' | 'Poor';
  tamperingDetected: boolean;
  dataConsistency: boolean;
}

export interface IVerification extends Document {
  documentId: Types.ObjectId;
  userId: Types.ObjectId;
  ocrText: string;
  charCount: number;
  documentType: string;
  confidence: number;
  extractedData: Record<string, string>;
  aiAnalysis: IAiAnalysis;
  issues: string[];
  status: 'verified' | 'uncertain' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

const verificationSchema = new Schema<IVerification>(
  {
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    ocrText: { type: String, default: '' },
    charCount: { type: Number, default: 0 },
    documentType: { type: String, default: 'unknown' },
    confidence: { type: Number, default: 0 },
    extractedData: { type: Schema.Types.Mixed, default: {} },
    aiAnalysis: {
      documentQuality: { type: String, enum: ['Good', 'Fair', 'Poor'], default: 'Poor' },
      tamperingDetected: { type: Boolean, default: false },
      dataConsistency: { type: Boolean, default: false },
    },
    issues: [{ type: String }],
    status: {
      type: String,
      enum: ['verified', 'uncertain', 'failed'],
      required: true,
    },
  },
  { timestamps: true }
);

export const VerificationModel = mongoose.model<IVerification>(
  'Verification',
  verificationSchema
);
