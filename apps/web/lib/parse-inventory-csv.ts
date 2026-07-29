/**
 * Parse inventory import CSV: sku,delta,reason[,note]
 * Header row optional if first cell is "sku".
 */
export type ParsedInventoryCsvRow = {
  sku: string;
  delta: number;
  reason: 'RECEIVE' | 'DAMAGE' | 'RECOUNT' | 'CORRECTION';
  note?: string;
};

const REASONS = new Set(['RECEIVE', 'DAMAGE', 'RECOUNT', 'CORRECTION']);

export function parseInventoryCsv(text: string): {
  rows: ParsedInventoryCsvRow[];
  parseErrors: Array<{ row: number; message: string }>;
} {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const parseErrors: Array<{ row: number; message: string }> = [];
  const rows: ParsedInventoryCsvRow[] = [];
  if (!lines.length) return { rows, parseErrors: [{ row: 0, message: 'Empty CSV' }] };

  let start = 0;
  const first = lines[0]!.toLowerCase();
  if (first.startsWith('sku,')) start = 1;

  for (let i = start; i < lines.length; i++) {
    const lineNo = i + 1;
    const parts = splitCsvLine(lines[i]!);
    if (parts.length < 3) {
      parseErrors.push({ row: lineNo, message: 'Need sku,delta,reason' });
      continue;
    }
    const sku = parts[0]!.trim();
    const delta = Number(parts[1]!.trim());
    const reason = parts[2]!.trim().toUpperCase();
    const note = parts[3]?.trim() || undefined;
    if (!sku) {
      parseErrors.push({ row: lineNo, message: 'Missing SKU' });
      continue;
    }
    if (!Number.isInteger(delta) || delta === 0) {
      parseErrors.push({ row: lineNo, message: 'delta must be non-zero integer' });
      continue;
    }
    if (!REASONS.has(reason)) {
      parseErrors.push({ row: lineNo, message: `Invalid reason ${reason}` });
      continue;
    }
    rows.push({
      sku,
      delta,
      reason: reason as ParsedInventoryCsvRow['reason'],
      note,
    });
  }
  return { rows, parseErrors };
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}
