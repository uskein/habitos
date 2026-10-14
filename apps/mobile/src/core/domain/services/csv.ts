/** Escapa un campo CSV (RFC4180: comillas duplicadas, coma/salto ⇒ entrecomillado). */
export function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** Construye un CSV con BOM UTF-8 para que Excel abra acentos correctamente. */
export function buildCsv(
  headers: string[],
  rows: readonly (readonly (string | number | boolean)[])[],
): string {
  const lines = [headers.map(escapeCsvField).join(',')];
  for (const row of rows) {
    lines.push(row.map((cell) => escapeCsvField(String(cell))).join(','));
  }
  // BOM UTF-8 (\uFEFF) — Excel en Windows lo necesita para ver «Hábitos» bien.
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}
