import { extractText } from './ocr';
import { classifyDocument } from './documentClassifier';
import { extractFields, getExpectedFields } from './fieldExtractor';
import { verifyFields, type VerificationReport } from './verifier';
import { detectAnomalies, type Anomaly } from './anomalyDetector';
import { scoreConfidence } from './confidenceScorer';

export interface FullAnalysisResult {
  ocrText: string;
  documentType: string;
  confidence: number;
  extractedData: Record<string, string>;
  aiAnalysis: {
    documentQuality: 'Good' | 'Fair' | 'Poor';
    tamperingDetected: boolean;
    dataConsistency: boolean;
    riskScore: number;
    anomalies: Anomaly[];
  };
  verificationReport: VerificationReport;
  issues: string[];
  status: 'verified' | 'uncertain' | 'failed';
}

function getDocumentQuality(text: string): 'Good' | 'Fair' | 'Poor' {
  const len = text.trim().length;
  if (len > 500) return 'Good';
  if (len > 100) return 'Fair';
  return 'Poor';
}

function emptyVerificationReport(): VerificationReport {
  return {
    findings: [],
    issues: [],
    dataConsistency: false,
    passedChecks: 0,
    totalChecks: 0,
    verificationStatus: 'failed',
  };
}

export async function analyzeDocument(
  buffer: Buffer,
  mimeType: string
): Promise<FullAnalysisResult> {
  const ocrText = await extractText(buffer, mimeType);

  if (ocrText.trim().length < 20) {
    return {
      ocrText,
      documentType: 'unknown',
      confidence: 0,
      extractedData: {},
      aiAnalysis: {
        documentQuality: 'Poor',
        tamperingDetected: false,
        dataConsistency: false,
        riskScore: 0,
        anomalies: [],
      },
      verificationReport: emptyVerificationReport(),
      issues: ['Could not extract readable text from document'],
      status: 'failed',
    };
  }

  const { documentType, confidence: classificationConfidence } = await classifyDocument(ocrText);
  const extractedData = await extractFields(ocrText, documentType);

  // Deterministic rule engine: required fields, formats, date consistency, duplicates.
  const verificationReport = verifyFields(extractedData, documentType);

  // Heuristic tampering signals: OCR quality, placeholder text, fabricated identifiers.
  const { anomalies, tamperingDetected, riskScore } = detectAnomalies(ocrText, extractedData);

  const documentQuality = getDocumentQuality(ocrText);

  const confidence = scoreConfidence({
    classificationConfidence,
    expectedFieldCount: getExpectedFields(documentType).length,
    extractedFieldCount: Object.keys(extractedData).length,
    issueCount: verificationReport.issues.length,
    riskScore,
    documentQuality,
  });

  const status: FullAnalysisResult['status'] =
    tamperingDetected || verificationReport.verificationStatus === 'failed'
      ? 'failed'
      : verificationReport.verificationStatus === 'passed' && anomalies.length === 0 && confidence >= 70
      ? 'verified'
      : documentQuality === 'Poor' || confidence < 40
      ? 'failed'
      : 'uncertain';

  return {
    ocrText,
    documentType,
    confidence,
    extractedData,
    aiAnalysis: {
      documentQuality,
      tamperingDetected,
      dataConsistency: verificationReport.dataConsistency,
      riskScore,
      anomalies,
    },
    verificationReport,
    issues: verificationReport.issues,
    status,
  };
}
