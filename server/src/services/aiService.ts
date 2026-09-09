import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const AI_BASE = process.env.AI_SERVICE_URL || 'http://localhost:8000';

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

export interface FullVerificationResult {
  ocrText: string;
  documentType: string;
  confidence: number;
  extractedData: Record<string, string>;
  aiAnalysis: AiAnalysis;
  verificationReport: VerificationReport;
  issues: string[];
  status: 'verified' | 'uncertain' | 'failed';
}

export async function runFullVerification(
  filePath: string,
  mimeType: string
): Promise<FullVerificationResult> {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath), { contentType: mimeType });

  const { data } = await axios.post<FullVerificationResult>(`${AI_BASE}/verify`, form, {
    headers: form.getHeaders(),
    timeout: 120_000,
  });

  return data;
}

export async function runOcr(filePath: string, mimeType: string): Promise<string> {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath), { contentType: mimeType });

  const { data } = await axios.post<{ text: string }>(`${AI_BASE}/ocr`, form, {
    headers: form.getHeaders(),
    timeout: 120_000,
  });

  return data.text;
}
