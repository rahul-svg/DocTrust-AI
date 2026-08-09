export interface Verification {
  _id: string;
  documentId: { _id: string; originalName: string; mimeType: string } | string;
  userId: string;
  ocrText: string;
  charCount: number;
  status: 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}
