import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IVerification extends Document {
  documentId: Types.ObjectId;
  userId: Types.ObjectId;
  ocrText: string;
  charCount: number;
  status: 'completed' | 'failed';
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
    status: {
      type: String,
      enum: ['completed', 'failed'],
      required: true,
    },
  },
  { timestamps: true }
);

export const VerificationModel = mongoose.model<IVerification>(
  'Verification',
  verificationSchema
);
