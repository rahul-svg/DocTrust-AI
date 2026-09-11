export const DOCUMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  verified: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

export const VERIFICATION_STATUS_COLORS: Record<string, string> = {
  verified: 'bg-green-100 text-green-700',
  uncertain: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700',
};

export const REPORT_STATUS_COLORS: Record<string, string> = {
  passed: 'bg-green-100 text-green-700',
  flagged: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700',
};

export const QUALITY_COLORS: Record<string, string> = {
  Good: 'text-green-600',
  Fair: 'text-yellow-600',
  Poor: 'text-red-600',
};

export const RULE_SEVERITY_BADGE: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-orange-100 text-orange-700',
  low: 'bg-yellow-100 text-yellow-700',
};

export const CATEGORY_LABELS: Record<string, string> = {
  required_field: 'Required field',
  field_format: 'Format',
  consistency: 'Consistency',
  duplicate: 'Duplicate',
};

export function confidenceBarColor(confidence: number): string {
  if (confidence >= 70) return 'bg-green-500';
  if (confidence >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
}

export function confidenceHexColor(confidence: number): string {
  if (confidence >= 70) return '#22c55e';
  if (confidence >= 40) return '#eab308';
  return '#ef4444';
}

export function anomalySeverityLabel(severity: number): string {
  if (severity >= 0.7) return 'HIGH';
  if (severity >= 0.4) return 'MED';
  return 'LOW';
}

export function anomalySeverityBadge(severity: number): string {
  if (severity >= 0.7) return 'bg-red-100 text-red-700';
  if (severity >= 0.4) return 'bg-orange-100 text-orange-700';
  return 'bg-yellow-100 text-yellow-700';
}
