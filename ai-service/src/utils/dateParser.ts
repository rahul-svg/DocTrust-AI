/**
 * Parse the date formats that turn up in extracted document fields.
 *
 * `new Date()` alone is not enough: it reads "01-02-2000" as an invalid date
 * in some runtimes and as month-first in others, while documents commonly use
 * day-first (the project spec's own example is "01-01-2000").
 */
export function parseFlexibleDate(value: string | undefined | null): Date | null {
  if (!value) return null;

  const text = String(value).trim();
  if (!text) return null;

  // ISO-like: YYYY-MM-DD or YYYY/MM/DD
  const iso = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (iso) {
    return buildDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  }

  // Day-first: DD-MM-YYYY or DD/MM/YYYY. If the first part is > 12 it can only
  // be a day; if the second is > 12 the document must be month-first instead.
  const dmy = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmy) {
    const first = Number(dmy[1]);
    const second = Number(dmy[2]);
    const year = Number(dmy[3]);
    if (second > 12 && first <= 12) return buildDate(year, first, second);
    return buildDate(year, second, first);
  }

  // Fall back to the runtime parser for spelled-out forms ("12 May 1990").
  const parsed = new Date(text);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function buildDate(year: number, month: number, day: number): Date | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const date = new Date(Date.UTC(year, month - 1, day));

  // Reject rollovers such as 31 February.
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}
