export type DocumentStatus = 'pending' | 'processing' | 'verified' | 'failed';

export interface Document {
  _id: string;
  userId: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  status: DocumentStatus;
  createdAt: string;
  updatedAt: string;
}
