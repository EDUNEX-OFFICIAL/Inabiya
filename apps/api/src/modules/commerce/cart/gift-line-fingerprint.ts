/** Stable cart-line identity for personalization + gift extras (key-order safe). */

export type GiftExtrasSnapshotLike = {
  note?: { label?: string; value?: string; pricePaise?: number } | null;
  wrap?: { id?: string; label?: string; pricePaise?: number } | null;
  ribbon?: { id?: string; label?: string; pricePaise?: number } | null;
};

function sortedPersonalization(raw: unknown): Array<[string, string]> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [];
  return Object.entries(raw as Record<string, unknown>)
    .filter(([, v]) => typeof v === 'string')
    .map(([k, v]) => [k, (v as string).trim()] as [string, string])
    .filter(([, v]) => v.length > 0)
    .sort(([a], [b]) => a.localeCompare(b));
}

export function giftLineFingerprint(
  personalization: unknown,
  giftExtras: GiftExtrasSnapshotLike | null | undefined,
): string {
  const extras = giftExtras ?? {};
  return JSON.stringify({
    personalization: sortedPersonalization(personalization),
    note: extras.note?.value?.trim() || null,
    wrapId: extras.wrap?.id || null,
    ribbonId: extras.ribbon?.id || null,
  });
}

export function giftExtrasUnitPaise(extras: GiftExtrasSnapshotLike | null | undefined): number {
  if (!extras) return 0;
  const note = Number.isInteger(extras.note?.pricePaise)
    ? Math.max(0, extras.note!.pricePaise!)
    : 0;
  const wrap = Number.isInteger(extras.wrap?.pricePaise)
    ? Math.max(0, extras.wrap!.pricePaise!)
    : 0;
  const ribbon = Number.isInteger(extras.ribbon?.pricePaise)
    ? Math.max(0, extras.ribbon!.pricePaise!)
    : 0;
  return note + wrap + ribbon;
}
