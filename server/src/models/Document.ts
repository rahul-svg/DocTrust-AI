import mongoose, { Document, Schema, Types } from 'mongoose';

export type DocumentStatus = 'pending' | 'processing' | 'verified' | 'failed';

export interface IDocument extends Document {
  userId: Types.ObjectId;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  path: string;
  status: DocumentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new Schema<IDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    originalName: { type: String, required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    path: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'verified', 'failed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

export const DocumentModel = mongoose.model<IDocument>('Document', documentSchema);
