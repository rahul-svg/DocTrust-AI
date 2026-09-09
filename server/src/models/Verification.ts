import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAnomaly {
  code: string;
  message: string;
  severity: number;
}

export interface IAiAnalysis {
  documentQuality: 'Good' | 'Fair' | 'Poor';
  tamperingDetected: boolean;
  dataConsistency: boolean;
  riskScore: number;
  anomalies: IAnomaly[];
}

export interface IRuleFinding {
  code: string;
  category: 'required_field' | 'field_format' | 'consistency' | 'duplicate';
  severity: 'high' | 'medium' | 'low';
  message: string;
}

export interface IVerificationReport {
  findings: IRuleFinding[];
  issues: string[];
  dataConsistency: boolean;
  passedChecks: number;
  totalChecks: number;
  verificationStatus: 'passed' | 'flagged' | 'failed';
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
  verificationReport: IVerificationReport;
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
      riskScore: { type: Number, default: 0 },
      anomalies: {
        type: [
          {
            _id: false,
            code: { type: String, required: true },
            message: { type: String, required: true },
            severity: { type: Number, required: true },
          },
        ],
        default: [],
      },
    },
    verificationReport: {
      findings: {
        type: [
          {
            _id: false,
            code: { type: String, required: true },
            category: {
              type: String,
              enum: ['required_field', 'field_format', 'consistency', 'duplicate'],
              required: true,
            },
            severity: { type: String, enum: ['high', 'medium', 'low'], required: true },
            message: { type: String, required: true },
          },
        ],
        default: [],
      },
      issues: { type: [String], default: [] },
      dataConsistency: { type: Boolean, default: false },
      passedChecks: { type: Number, default: 0 },
      totalChecks: { type: Number, default: 0 },
      verificationStatus: {
        type: String,
        enum: ['passed', 'flagged', 'failed'],
        default: 'failed',
      },
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
