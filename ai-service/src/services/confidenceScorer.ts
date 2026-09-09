export interface ConfidenceInput {
  /** Classifier confidence, 0–1. */
  classificationConfidence: number;
  /** Fields the schema asked for versus fields actually found. */
  expectedFieldCount: number;
  extractedFieldCount: number;
  /** Validation issues raised by the verifier. */
  issueCount: number;
  /** Combined anomaly severity, 0–1. */
  riskScore: number;
  documentQuality: 'Good' | 'Fair' | 'Poor';
}

const QUALITY_WEIGHT: Record<ConfidenceInput['documentQuality'], number> = {
  Good: 1,
  Fair: 0.8,
  Poor: 0.5,
};

/**
 * Blend the individual signals into a single 0–100 confidence score.
 *
 * Classification confidence and field coverage contribute positively;
 * validation issues and anomaly risk subtract from the result.
 */
export function scoreConfidence(input: ConfidenceInput): number {
  const {
    classificationConfidence,
    expectedFieldCount,
    extractedFieldCount,
    issueCount,
    riskScore,
    documentQuality,
  } = input;

  const coverage =
    expectedFieldCount > 0 ? Math.min(1, extractedFieldCount / expectedFieldCount) : 0;

  // Weighted base: classification is the strongest single signal.
  const base = 0.5 * classificationConfidence + 0.3 * coverage + 0.2 * QUALITY_WEIGHT[documentQuality];

  // Each validation issue costs 5 points, capped at 25 so a noisy document
  // cannot drive the score to zero on issues alone.
  const issuePenalty = Math.min(0.25, issueCount * 0.05);

  // Anomaly risk is the heaviest penalty — it speaks to authenticity.
  const anomalyPenalty = riskScore * 0.4;

  const score = base - issuePenalty - anomalyPenalty;

  return Math.round(Math.min(1, Math.max(0, score)) * 100);
}
