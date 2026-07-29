/**
 * Keyset (cursor) helpers for admin catalog product list.
 *
 * Sort: updatedAt DESC, id DESC (stable tie-break).
 * Opaque cursor = base64url(`${isoUpdatedAt}_${uuid}`).
 *
 * Prefer keyset over OFFSET — deep pages stay O(log n) with the compound index.
 * Prefer keyset over Prisma `cursor: { id }` + `skip: 1` when orderBy is not the PK alone
 * (avoids duplicate/skipped rows when many share the same updatedAt).
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type AdminProductCursor = {
  updatedAt: Date;
  id: string;
};

export function encodeAdminProductCursor(row: { updatedAt: Date; id: string }): string {
  return Buffer.from(`${row.updatedAt.toISOString()}_${row.id}`, 'utf8').toString('base64url');
}

export function decodeAdminProductCursor(raw: string): AdminProductCursor {
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
  const updatedAt = new Date(iso);
  if (Number.isNaN(updatedAt.getTime())) throw new Error('INVALID_CURSOR');
  return { updatedAt, id };
}

/** Rows strictly after `cursor` in (updatedAt DESC, id DESC) order. */
export function adminProductKeysetAfter(cursor: AdminProductCursor): {
  OR: Array<Record<string, unknown>>;
} {
  return {
    OR: [
      { updatedAt: { lt: cursor.updatedAt } },
      { AND: [{ updatedAt: cursor.updatedAt }, { id: { lt: cursor.id } }] },
    ],
  };
}
