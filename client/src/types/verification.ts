export interface AiAnalysis {
  documentQuality: 'Good' | 'Fair' | 'Poor';
  tamperingDetected: boolean;
  dataConsistency: boolean;
}

export interface Verification {
  _id: string;
  documentId: { _id: string; originalName: string; mimeType: string } | string;
  userId: string;
  ocrText: string;
  charCount: number;
  documentType: string;
  confidence: number;
  extractedData: Record<string, string>;
  aiAnalysis: AiAnalysis;
  issues: string[];
  status: 'verified' | 'uncertain' | 'failed';
  createdAt: string;
  updatedAt: string;
}
