/** Unique brand names for PDP / cards / BYB (order preserved). */
export function collectBrandNames(input: {
  brandName?: string | null;
  hamperItems?: Array<{ brandName?: string | null }> | null;
}): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  const push = (raw?: string | null) => {
    if (!raw) return;
    for (const part of raw.split(',').map((s) => s.trim()).filter(Boolean)) {
      const key = part.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(part);
    }
  };

  for (const item of input.hamperItems ?? []) {
    push(item.brandName);
  }
  if (out.length === 0) {
    push(input.brandName);
  }
  return out;
}
