/**
 * Keyset cursor for admin reviews desk (createdAt DESC, id DESC).
 * Opaque: base64url(`${isoCreatedAt}_${uuid}`)
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type AdminReviewCursor = {
  createdAt: Date;
  id: string;
};

export function encodeAdminReviewCursor(row: { createdAt: Date; id: string }): string {
  return Buffer.from(`${row.createdAt.toISOString()}_${row.id}`, 'utf8').toString('base64url');
}

export function decodeAdminReviewCursor(raw: string): AdminReviewCursor {
  let decoded: string;
  try {
    decoded = Buffer.from(raw, 'base64url').toString('utf8');
  } catch {
    throw new Error('INVALID_CURSOR');
  }
  const sep = decoded.lastIndexOf('_');
  if (sep <= 0) throw new Error('INVALID_CURSOR');
  const iso = decoded.slice(0, sep);
  const id = decoded.slice(sep + 1);
  if (!UUID_RE.test(id)) throw new Error('INVALID_CURSOR');
  const createdAt = new Date(iso);
  if (Number.isNaN(createdAt.getTime())) throw new Error('INVALID_CURSOR');
  return { createdAt, id };
}

/** Rows strictly after cursor in (createdAt DESC, id DESC). */
export function adminReviewKeysetAfter(cursor: AdminReviewCursor): {
  OR: Array<Record<string, unknown>>;
} {
  return {
    OR: [
      { createdAt: { lt: cursor.createdAt } },
      { AND: [{ createdAt: cursor.createdAt }, { id: { lt: cursor.id } }] },
    ],
  };
}
