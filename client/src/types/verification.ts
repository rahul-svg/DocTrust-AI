export interface Anomaly {
  code: string;
  message: string;
  severity: number;
}

export interface AiAnalysis {
  documentQuality: 'Good' | 'Fair' | 'Poor';
  tamperingDetected: boolean;
  dataConsistency: boolean;
  riskScore: number;
  anomalies: Anomaly[];
}

export interface RuleFinding {
  code: string;
  category: 'required_field' | 'field_format' | 'consistency' | 'duplicate';
  severity: 'high' | 'medium' | 'low';
  message: string;
}

export interface VerificationReport {
  findings: RuleFinding[];
  issues: string[];
  dataConsistency: boolean;
  passedChecks: number;
  totalChecks: number;
  verificationStatus: 'passed' | 'flagged' | 'failed';
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
  verificationReport: VerificationReport;
  issues: string[];
  status: 'verified' | 'uncertain' | 'failed';
  createdAt: string;
  updatedAt: string;
}
