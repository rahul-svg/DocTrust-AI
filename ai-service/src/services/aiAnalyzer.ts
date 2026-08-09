import { extractText } from './ocr';
import { classifyDocument } from './documentClassifier';
import { extractFields } from './fieldExtractor';
import { verifyFields } from './verifier';

export interface FullAnalysisResult {
  ocrText: string;
  documentType: string;
  confidence: number;
  extractedData: Record<string, string>;
  aiAnalysis: {
    documentQuality: 'Good' | 'Fair' | 'Poor';
    tamperingDetected: boolean;
    dataConsistency: boolean;
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
      aiAnalysis: { documentQuality: 'Poor', tamperingDetected: false, dataConsistency: false },
      issues: ['Could not extract readable text from document'],
      status: 'failed',
    };
  }

  const { documentType, confidence } = await classifyDocument(ocrText);
  const extractedData = await extractFields(ocrText, documentType);
  const { issues, tamperingDetected, dataConsistency } = verifyFields(extractedData, documentType);

  const documentQuality = getDocumentQuality(ocrText);

  const status: FullAnalysisResult['status'] =
    issues.length === 0 && confidence >= 0.7
      ? 'verified'
      : documentQuality === 'Poor' || confidence < 0.4
      ? 'failed'
      : 'uncertain';

  return {
    ocrText,
    documentType,
    confidence: Math.round(confidence * 100),
    extractedData,
    aiAnalysis: { documentQuality, tamperingDetected, dataConsistency },
    issues,
    status,
  };
}
