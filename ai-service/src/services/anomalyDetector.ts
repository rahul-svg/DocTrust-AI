export interface Anomaly {
  code: string;
  message: string;
  /** How strongly this anomaly suggests tampering, 0–1. */
  severity: number;
}

export interface AnomalyResult {
  anomalies: Anomaly[];
  tamperingDetected: boolean;
  /** Combined severity of all anomalies, 0–1. */
  riskScore: number;
}

/** Characters Tesseract emits when it cannot resolve a glyph — a sign of an edited or degraded scan. */
const GARBLE_PATTERN = /[^\p{L}\p{N}\p{P}\p{Zs}\n]/gu;

/** Field values a person would never realistically have; usually a sign of overwritten text. */
const PLACEHOLDER_VALUES = ['n/a', 'xxxx', 'xxxxxx', 'sample', 'specimen', 'test', 'void', 'null'];

function ratioOfGarble(text: string): number {
  if (!text.length) return 0;
  return (text.match(GARBLE_PATTERN)?.length ?? 0) / text.length;
}

/**
 * Heuristic tampering signals over the OCR text and extracted fields.
 *
 * These are indicators, not proof — a positive result means the document
 * warrants human review, never that it is definitively forged.
 *
 * Deterministic checks (required fields, field formats, date ordering,
 * duplicate values) live in the rule-based verification engine instead
 * (see verifier.ts) — this detector only covers signals that are inherently
 * fuzzy: OCR quality, implausible placeholder text, and fabricated-looking
 * identifiers.
 */
export function detectAnomalies(
  ocrText: string,
  fields: Record<string, string>
): AnomalyResult {
  const anomalies: Anomaly[] = [];

  // 1. Unreadable characters suggest a manipulated or poor-quality scan.
  const garble = ratioOfGarble(ocrText);
  if (garble > 0.08) {
    anomalies.push({
      code: 'high_garble_ratio',
      message: `Unusually high proportion of unreadable characters (${Math.round(garble * 100)}%)`,
      severity: garble > 0.15 ? 0.5 : 0.3,
    });
  }

  // 2. Placeholder values where real data should be.
  for (const [key, value] of Object.entries(fields)) {
    if (PLACEHOLDER_VALUES.includes(value.trim().toLowerCase())) {
      anomalies.push({
        code: 'placeholder_value',
        message: `Field "${key}" contains a placeholder value: "${value}"`,
        severity: 0.4,
      });
    }
  }

  // 3. Repeated digits in an identifier — a common sign of a fabricated number.
  for (const [key, value] of Object.entries(fields)) {
    if (!/number|id$|^id|licen[cs]e/i.test(key)) continue;
    const digits = value.replace(/\D/g, '');
    if (digits.length >= 6 && new Set(digits).size === 1) {
      anomalies.push({
        code: 'repeated_identifier_digits',
        message: `Identifier "${key}" is a single repeated digit: ${value}`,
        severity: 0.5,
      });
    }
  }

  // Combine severities so several weak signals can still raise overall risk,
  // without any single one saturating the score.
  const riskScore = anomalies.reduce((risk, a) => risk + (1 - risk) * a.severity, 0);

  return {
    anomalies,
    tamperingDetected: riskScore >= 0.5,
    riskScore: Math.round(riskScore * 100) / 100,
  };
}
