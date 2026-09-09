import { extractText } from './ocr';
import { classifyDocument } from './documentClassifier';
import { extractFields, getExpectedFields } from './fieldExtractor';
import { verifyFields } from './verifier';
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
  issues: string[];
  status: 'verified' | 'uncertain' | 'failed';
}

function getDocumentQuality(text: string): 'Good' | 'Fair' | 'Poor' {
  const len = text.trim().length;
  if (len > 500) return 'Good';
  if (len > 100) return 'Fair';
  return 'Poor';
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
      issues: ['Could not extract readable text from document'],
      status: 'failed',
    };
  }

  const { documentType, confidence: classificationConfidence } = await classifyDocument(ocrText);
  const extractedData = await extractFields(ocrText, documentType);
  const { issues, dataConsistency } = verifyFields(extractedData, documentType);

  const { anomalies, tamperingDetected, riskScore } = detectAnomalies(
    ocrText,
    extractedData,
    documentType
  );

  const documentQuality = getDocumentQuality(ocrText);

  const confidence = scoreConfidence({
    classificationConfidence,
    expectedFieldCount: getExpectedFields(documentType).length,
    extractedFieldCount: Object.keys(extractedData).length,
    issueCount: issues.length,
    riskScore,
    documentQuality,
  });

  // `issues` stays the validation-rule list; anomaly detail lives in
  // aiAnalysis.anomalies so consumers can render severity alongside each one.
  const status: FullAnalysisResult['status'] = tamperingDetected
    ? 'failed'
    : issues.length === 0 && anomalies.length === 0 && confidence >= 70
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
      dataConsistency,
      riskScore,
      anomalies,
    },
    issues,
    status,
  };
}
