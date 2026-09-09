import { parseFlexibleDate } from '../utils/dateParser';
import { getExpectedFields } from './fieldExtractor';
import type { DocumentType } from './documentClassifier';

export type RuleCategory = 'required_field' | 'field_format' | 'consistency' | 'duplicate';
export type RuleSeverity = 'high' | 'medium' | 'low';

export interface RuleFinding {
  code: string;
  category: RuleCategory;
  severity: RuleSeverity;
  message: string;
}

export interface VerificationReport {
  findings: RuleFinding[];
  /** Plain-text messages, kept for callers that only want a flat list. */
  issues: string[];
  /** No consistency-category finding was raised. */
  dataConsistency: boolean;
  passedChecks: number;
  totalChecks: number;
  verificationStatus: 'passed' | 'flagged' | 'failed';
}

const ID_DOC_TYPES = ['identity_card', 'passport', 'drivers_license'];
const DATE_FIELD_PATTERN = /date|dob|expiry|issued|effective/i;
const AMOUNT_FIELD_PATTERN = /amount|balance|income|total/i;
const IDENTIFIER_FIELD_PATTERN = /number|^id$|id$|taxid/i;

function isBlank(value: string | undefined): boolean {
  return value === undefined || value.trim().length === 0;
}

/** Which extracted fields are required but absent or empty. */
function checkRequiredFields(
  fields: Record<string, string>,
  documentType: DocumentType | string
): { findings: RuleFinding[]; checked: number } {
  const expected = getExpectedFields(documentType);
  const findings: RuleFinding[] = [];

  for (const field of expected) {
    if (isBlank(fields[field])) {
      findings.push({
        code: 'missing_required_field',
        category: 'required_field',
        severity: 'high',
        message: `Required field "${field}" is missing`,
      });
    }
  }

  return { findings, checked: expected.length };
}

/** Fields whose value does not match the shape expected for that kind of field. */
function checkFieldFormats(
  fields: Record<string, string>
): { findings: RuleFinding[]; checked: number } {
  const findings: RuleFinding[] = [];
  let checked = 0;

  for (const [key, value] of Object.entries(fields)) {
    if (isBlank(value)) continue;

    if (DATE_FIELD_PATTERN.test(key)) {
      checked++;
      if (!parseFlexibleDate(value)) {
        findings.push({
          code: 'invalid_date_format',
          category: 'field_format',
          severity: 'medium',
          message: `Field "${key}" has an unrecognised date format: "${value}"`,
        });
      }
    } else if (AMOUNT_FIELD_PATTERN.test(key)) {
      checked++;
      if (!/^\s*[$€£₹]?\s*[\d,]+(\.\d+)?\s*$/.test(value)) {
        findings.push({
          code: 'invalid_amount_format',
          category: 'field_format',
          severity: 'low',
          message: `Field "${key}" does not look like a numeric amount: "${value}"`,
        });
      }
    } else if (IDENTIFIER_FIELD_PATTERN.test(key)) {
      checked++;
      if (value.trim().length < 3) {
        findings.push({
          code: 'invalid_identifier_format',
          category: 'field_format',
          severity: 'medium',
          message: `Field "${key}" is too short to be a valid identifier: "${value}"`,
        });
      }
    }
  }

  return { findings, checked };
}

/** Cross-field date logic: births, issue and expiry must sit in a sane order. */
function checkDataConsistency(
  fields: Record<string, string>,
  documentType: DocumentType | string
): { findings: RuleFinding[]; checked: number } {
  const findings: RuleFinding[] = [];
  let checked = 0;

  const dob = parseFlexibleDate(fields.dateOfBirth);
  const issue = parseFlexibleDate(
    fields.issueDate ?? fields.date ?? fields.contractDate ?? fields.statementDate ?? fields.recordDate
  );
  const expiry = parseFlexibleDate(fields.expiryDate);
  const now = new Date();

  if (dob) {
    checked++;
    if (dob > now) {
      findings.push({
        code: 'future_date_of_birth',
        category: 'consistency',
        severity: 'high',
        message: 'Date of birth is in the future',
      });
    } else {
      const ageYears = (now.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      if (ageYears > 120) {
        findings.push({
          code: 'implausible_age',
          category: 'consistency',
          severity: 'medium',
          message: `Date of birth implies an age of ${Math.round(ageYears)} years`,
        });
      }
    }
  }

  if (issue && expiry) {
    checked++;
    if (expiry < issue) {
      findings.push({
        code: 'expiry_before_issue',
        category: 'consistency',
        severity: 'high',
        message: 'Expiry date falls before the issue date',
      });
    }
  }

  if (dob && issue) {
    checked++;
    if (issue < dob) {
      findings.push({
        code: 'issued_before_birth',
        category: 'consistency',
        severity: 'high',
        message: 'Document was issued before the holder was born',
      });
    }
  }

  if (ID_DOC_TYPES.includes(documentType) && expiry) {
    checked++;
    if (expiry < now) {
      findings.push({
        code: 'document_expired',
        category: 'consistency',
        severity: 'medium',
        message: 'Document has expired',
      });
    }
  }

  return { findings, checked };
}

/** The same non-trivial value reused verbatim across two different fields. */
function checkDuplicateInformation(
  fields: Record<string, string>
): { findings: RuleFinding[]; checked: number } {
  const findings: RuleFinding[] = [];
  const seen = new Map<string, string>();

  for (const [key, value] of Object.entries(fields)) {
    const normalised = value.trim().toLowerCase();
    if (normalised.length < 4) continue;

    const previous = seen.get(normalised);
    if (previous) {
      findings.push({
        code: 'duplicate_field_value',
        category: 'duplicate',
        severity: 'low',
        message: `Fields "${previous}" and "${key}" share the identical value "${value}"`,
      });
    } else {
      seen.set(normalised, key);
    }
  }

  return { findings, checked: 1 };
}

/**
 * Run the deterministic verification rules over extracted fields.
 *
 * This is the rule-based verification engine: required-field validation,
 * field-format validation, cross-field consistency and duplicate-value
 * detection. Heuristic tampering signals (OCR garble, placeholder values,
 * repeated-digit identifiers) live in the anomaly detector instead — this
 * engine only reports on things it can check deterministically.
 */
export function verifyFields(
  fields: Record<string, string>,
  documentType: DocumentType | string
): VerificationReport {
  const required = checkRequiredFields(fields, documentType);
  const formats = checkFieldFormats(fields);
  const consistency = checkDataConsistency(fields, documentType);
  const duplicates = checkDuplicateInformation(fields);

  const findings = [
    ...required.findings,
    ...formats.findings,
    ...consistency.findings,
    ...duplicates.findings,
  ];

  const totalChecks = required.checked + formats.checked + consistency.checked + duplicates.checked;
  const passedChecks = Math.max(0, totalChecks - findings.length);

  const verificationStatus: VerificationReport['verificationStatus'] = findings.some(
    (f) => f.severity === 'high'
  )
    ? 'failed'
    : findings.length > 0
    ? 'flagged'
    : 'passed';

  return {
    findings,
    issues: findings.map((f) => f.message),
    dataConsistency: !findings.some((f) => f.category === 'consistency'),
    passedChecks,
    totalChecks,
    verificationStatus,
  };
}
