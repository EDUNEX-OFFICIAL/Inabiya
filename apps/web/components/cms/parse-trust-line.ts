/** CMS hero trust chips — middot / pipe / newline list. Empty means hidden (no hardcoded fallback). */

export const DEFAULT_HERO_TRUST = [
  'Baby-safe brands',
  'Free shipping over ₹2,000',
  'PAN-India delivery',
] as const;

export type TrustIconKind = 'shield' | 'truck' | 'heart';

export const TRUST_ICON_KINDS: TrustIconKind[] = ['shield', 'truck', 'heart'];

export type TrustChip = { icon: TrustIconKind; label: string };

/** Match icon to label so removing a chip does not reshuffle the rest. */
export function trustIconKind(label: string, index: number): TrustIconKind {
  if (/ship|truck|courier|dispatch/i.test(label)) return 'truck';
  if (/safe|shield|trust|quality|tested/i.test(label)) return 'shield';
  if (/india|deliver|pan[\s-]?india|heart|care|gift/i.test(label)) return 'heart';
  const cycle: TrustIconKind[] = ['shield', 'truck', 'heart'];
  return cycle[index % 3]!;
}

function splitTrustRaw(raw: string): string[] {
  if (/[·|•]/.test(raw) && !raw.includes('\n')) {
    return raw.split(/\s*[·|•]\s*/);
  }
  return raw.split('\n');
}

function parseChipPart(part: string, index: number): TrustChip {
  const trimmed = part.trim();
  const m = trimmed.match(/^(shield|truck|heart)\s*:\s*(.*)$/i);
  if (m?.[1]) {
    return { icon: m[1].toLowerCase() as TrustIconKind, label: m[2] ?? '' };
  }
  return { icon: trustIconKind(trimmed, index), label: trimmed };
}

/** Storefront / preview — skips blank labels. */
export function parseTrustChips(trustLine?: string): TrustChip[] {
  if (!trustLine?.trim()) return [];
  return splitTrustRaw(trustLine)
    .map((part, i) => parseChipPart(part, i))
    .filter((row) => row.label.trim())
    .slice(0, 6);
}

/** Inspector draft — keeps empty rows so typing does not delete the chip. */
export function parseTrustChipDrafts(trustLine?: string): TrustChip[] {
  if (trustLine == null || trustLine === '') return [];
  return splitTrustRaw(trustLine)
    .slice(0, 6)
    .map((part, i) => parseChipPart(part, i));
}

export function serializeTrustChips(chips: TrustChip[]): string {
  return chips.map((c) => `${c.icon}:${c.label.replace(/\n/g, ' ')}`).join('\n');
}

export function parseTrustLine(trustLine?: string): string[] {
  return parseTrustChips(trustLine).map((c) => c.label);
}

export function serializeTrustLine(chips: string[]): string {
  return serializeTrustChips(
    chips.map((label, i) => ({ icon: trustIconKind(label, i), label })),
  );
}

export function defaultHeroTrustLine(): string {
  return serializeTrustChips(
    DEFAULT_HERO_TRUST.map((label, i) => ({
      icon: trustIconKind(label, i),
      label,
    })),
  );
}
