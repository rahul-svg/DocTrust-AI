import type { DocumentType } from './documentClassifier';

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

const ID_DOC_TYPES: string[] = ['identity_card', 'passport', 'drivers_license'];

/** Characters Tesseract emits when it cannot resolve a glyph — a sign of an edited or degraded scan. */
const GARBLE_PATTERN = /[^\p{L}\p{N}\p{P}\p{Zs}\n]/gu;

/** Field values a person would never realistically have; usually a sign of overwritten text. */
const PLACEHOLDER_VALUES = ['n/a', 'xxxx', 'xxxxxx', 'sample', 'specimen', 'test', 'void', 'null'];

function ratioOfGarble(text: string): number {
  if (!text.length) return 0;
  return (text.match(GARBLE_PATTERN)?.length ?? 0) / text.length;
}

function parseDate(value: string): Date | null {
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Heuristic anomaly detection over the OCR text and extracted fields.
 *
 * These are indicators, not proof — a positive result means the document
 * warrants human review, never that it is definitively forged.
 */
export function detectAnomalies(
  ocrText: string,
  fields: Record<string, string>,
  documentType: DocumentType | string
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

  // 4. Chronological impossibilities.
  const dob = fields.dateOfBirth ? parseDate(fields.dateOfBirth) : null;
  const now = new Date();

  if (dob) {
    if (dob > now) {
      anomalies.push({
        code: 'future_date_of_birth',
        message: 'Date of birth is in the future',
        severity: 0.7,
      });
    } else {
      const ageYears = (now.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      if (ageYears > 120) {
        anomalies.push({
          code: 'implausible_age',
          message: `Date of birth implies an age of ${Math.round(ageYears)} years`,
          severity: 0.6,
        });
      }
    }
  }

  const issueDate = parseDate(fields.issueDate ?? fields.date ?? '');
  const expiryDate = parseDate(fields.expiryDate ?? '');

  if (issueDate && expiryDate && expiryDate < issueDate) {
    anomalies.push({
      code: 'expiry_before_issue',
      message: 'Expiry date falls before the issue date',
      severity: 0.8,
    });
  }

  if (dob && issueDate && issueDate < dob) {
    anomalies.push({
      code: 'issued_before_birth',
      message: 'Document was issued before the holder was born',
      severity: 0.9,
    });
  }

  // 5. An identity document with no identifier at all.
  if (ID_DOC_TYPES.includes(documentType)) {
    const hasIdentifier = Object.keys(fields).some((k) => /number|id$|^id/i.test(k));
    if (!hasIdentifier) {
      anomalies.push({
        code: 'missing_identifier',
        message: 'Identity document contains no document number',
        severity: 0.4,
      });
    }
  }

  // 6. The same value reused across unrelated fields.
  const seen = new Map<string, string>();
  for (const [key, value] of Object.entries(fields)) {
    const normalised = value.trim().toLowerCase();
    if (normalised.length < 4) continue;
    const previous = seen.get(normalised);
    if (previous) {
      anomalies.push({
        code: 'duplicate_field_value',
        message: `Fields "${previous}" and "${key}" share the identical value "${value}"`,
        severity: 0.3,
      });
    } else {
      seen.set(normalised, key);
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
