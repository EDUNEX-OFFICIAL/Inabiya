/**
 * Parse product import CSV.
 * Header: slug,title,sku,pricePaise[,onHand][,description][,compareAtPaise][,status][,imageUrl][,label]
 */
export type ParsedProductCsvRow = {
  slug: string;
  title: string;
  sku: string;
  pricePaise: number;
  onHand: number;
  description?: string;
  compareAtPaise?: number;
  status: 'DRAFT' | 'PUBLISHED';
  imageUrl?: string;
  label: string;
};

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

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function parseProductCsv(text: string): {
  rows: ParsedProductCsvRow[];
  parseErrors: Array<{ row: number; message: string }>;
} {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const parseErrors: Array<{ row: number; message: string }> = [];
  const rows: ParsedProductCsvRow[] = [];
  if (!lines.length) return { rows, parseErrors: [{ row: 0, message: 'Empty CSV' }] };

  let start = 0;
  const first = lines[0]!.toLowerCase();
  if (first.startsWith('slug,')) start = 1;

  const seenSlugs = new Set<string>();
  const seenSkus = new Set<string>();

  for (let i = start; i < lines.length; i++) {
    const lineNo = i + 1;
    const parts = splitCsvLine(lines[i]!).map((p) => p.trim());
    if (parts.length < 4) {
      parseErrors.push({ row: lineNo, message: 'Need slug,title,sku,pricePaise' });
      continue;
    }
    const slug = (parts[0] ?? '').toLowerCase();
    const title = parts[1] ?? '';
    const sku = parts[2] ?? '';
    const pricePaise = Number(parts[3]);
    const onHandRaw = parts[4];
    const description = parts[5] || undefined;
    const compareRaw = parts[6];
    const statusRaw = (parts[7] || 'DRAFT').toUpperCase();
    const imageUrl = parts[8] || undefined;
    const label = parts[9] || 'Default';

    if (!slug || !SLUG_RE.test(slug)) {
      parseErrors.push({ row: lineNo, message: 'Invalid slug' });
      continue;
    }
    if (!title) {
      parseErrors.push({ row: lineNo, message: 'Missing title' });
      continue;
    }
    if (!sku) {
      parseErrors.push({ row: lineNo, message: 'Missing SKU' });
      continue;
    }
    if (!Number.isInteger(pricePaise) || pricePaise < 0) {
      parseErrors.push({ row: lineNo, message: 'pricePaise must be non-negative integer' });
      continue;
    }
    let onHand = 0;
    if (onHandRaw != null && onHandRaw !== '') {
      onHand = Number(onHandRaw);
      if (!Number.isInteger(onHand) || onHand < 0) {
        parseErrors.push({ row: lineNo, message: 'onHand must be non-negative integer' });
        continue;
      }
    }
    let compareAtPaise: number | undefined;
    if (compareRaw != null && compareRaw !== '') {
      compareAtPaise = Number(compareRaw);
      if (!Number.isInteger(compareAtPaise) || compareAtPaise < 0) {
        parseErrors.push({ row: lineNo, message: 'compareAtPaise must be non-negative integer' });
        continue;
      }
      if (compareAtPaise < pricePaise) {
        parseErrors.push({ row: lineNo, message: 'compareAtPaise must be >= pricePaise' });
        continue;
      }
    }
    if (statusRaw !== 'DRAFT' && statusRaw !== 'PUBLISHED') {
      parseErrors.push({ row: lineNo, message: 'status must be DRAFT or PUBLISHED' });
      continue;
    }
    if (seenSlugs.has(slug)) {
      parseErrors.push({ row: lineNo, message: `Duplicate slug in file: ${slug}` });
      continue;
    }
    if (seenSkus.has(sku.toLowerCase())) {
      parseErrors.push({ row: lineNo, message: `Duplicate SKU in file: ${sku}` });
      continue;
    }
    seenSlugs.add(slug);
    seenSkus.add(sku.toLowerCase());

    rows.push({
      slug,
      title,
      sku,
      pricePaise,
      onHand,
      description,
      compareAtPaise,
      status: statusRaw,
      imageUrl,
      label,
    });
  }
  return { rows, parseErrors };
}
