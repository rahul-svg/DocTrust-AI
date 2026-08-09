export interface VerificationResult {
  issues: string[];
  tamperingDetected: boolean;
  dataConsistency: boolean;
}

const DATE_PATTERN = /\d{4}[-/]\d{2}[-/]\d{2}|\d{2}[-/]\d{2}[-/]\d{4}/;
const ID_DOC_TYPES = ['identity_card', 'passport', 'drivers_license'];

export function verifyFields(
  fields: Record<string, string>,
  documentType: string
): VerificationResult {
  const issues: string[] = [];

  const hasName = Object.keys(fields).some((k) => k.toLowerCase().includes('name'));
  if (!hasName) issues.push('No name field found in document');

  for (const [key, value] of Object.entries(fields)) {
    if (key.toLowerCase().includes('date') && value && !DATE_PATTERN.test(value)) {
      if (!/\d{4}/.test(value)) {
        issues.push(`Unrecognised date format for "${key}": ${value}`);
      }
    }
  }

  if (ID_DOC_TYPES.includes(documentType) && fields.expiryDate) {
    const expiry = new Date(fields.expiryDate);
    if (!isNaN(expiry.getTime()) && expiry < new Date()) {
      issues.push('Document has expired');
    }
  }

  return {
    issues,
    tamperingDetected: false, // anomaly detection added in Phase 6
    dataConsistency: issues.length === 0,
  };
}
