/** Per-block layout knobs — not a generic page grid. */

export const RECIPIENT_GRIDS = ['2x1', '2x2', '2x3', '3x2'] as const;
export type RecipientGrid = (typeof RECIPIENT_GRIDS)[number];

export const RECIPIENT_GRID_MAX: Record<RecipientGrid, number> = {
  '2x1': 2,
  '2x2': 4,
  '2x3': 6,
  '3x2': 6,
};

export const RECIPIENT_GRID_LABELS: Record<RecipientGrid, string> = {
  '2x1': '2 × 1 — two large',
  '2x2': '2 × 2',
  '2x3': '2 × 3',
  '3x2': '3 × 2',
};

export function parseRecipientGrid(raw: unknown): RecipientGrid {
  return RECIPIENT_GRIDS.includes(raw as RecipientGrid) ? (raw as RecipientGrid) : '2x1';
}

export const RECIPIENT_ACCENTS = ['pink', 'sky', 'mint', 'lavender'] as const;
export type RecipientAccent = (typeof RECIPIENT_ACCENTS)[number];

export function parseRecipientAccent(raw: unknown, fallbackIndex = 0): RecipientAccent {
  return RECIPIENT_ACCENTS.includes(raw as RecipientAccent)
    ? (raw as RecipientAccent)
    : (RECIPIENT_ACCENTS[fallbackIndex % RECIPIENT_ACCENTS.length] ?? 'pink');
}

export function parseUspColumns(raw: unknown): 2 | 3 | 4 {
  const n = Number(raw);
  return n === 2 || n === 3 || n === 4 ? n : 4;
}

export function parseOfferColumns(raw: unknown): 2 | 3 {
  return Number(raw) === 2 ? 2 : 3;
}

export function parseQuoteColumns(raw: unknown): 2 | 3 {
  return Number(raw) === 3 ? 3 : 2;
}

export function parseTestimonialsDisplay(
  raw: unknown,
  itemCount: number,
): 'marquee' | 'grid' {
  if (raw === 'grid' || raw === 'marquee') return raw;
  return itemCount >= 4 ? 'marquee' : 'grid';
}
