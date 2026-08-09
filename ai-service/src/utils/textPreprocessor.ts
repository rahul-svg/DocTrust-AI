/**
 * Normalise raw OCR/PDF text: uniform line endings, collapsed whitespace,
 * capped blank lines.
 */
export function preprocessText(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
