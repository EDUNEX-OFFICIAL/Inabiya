/**
 * Keyset (cursor) helpers for admin catalog product list.
 *
 * Default sort (`updated`): opaque cursor = base64url(`${isoUpdatedAt}_${uuid}`) — BC.
 * Other sorts: base64url JSON `{ k, … }` keyed by sort mode.
 *
 * Prefer keyset over OFFSET — deep pages stay O(log n) with compound indexes.
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type AdminListSort =
  | 'updated'
  | 'title_asc'
  | 'title_desc'
  | 'created'
  | 'price_asc'
  | 'price_desc';

export type AdminProductCursor = {
  updatedAt: Date;
  id: string;
};

type TitleCursor = { title: string; id: string };
type CreatedCursor = { createdAt: Date; id: string };
type PriceCursor = { pricePaise: number; id: string };

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

function b64json(payload: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

function parseB64json(raw: string): Record<string, unknown> {
  let decoded: string;
  try {
    decoded = Buffer.from(raw, 'base64url').toString('utf8');
  } catch {
    throw new Error('INVALID_CURSOR');
  }
  try {
    const obj = JSON.parse(decoded) as Record<string, unknown>;
    if (!obj || typeof obj !== 'object') throw new Error('INVALID_CURSOR');
    return obj;
  } catch {
    throw new Error('INVALID_CURSOR');
  }
}

export function encodeAdminListCursor(
  sort: AdminListSort,
  row: {
    id: string;
    updatedAt?: Date;
    createdAt?: Date;
    title?: string;
    fromPricePaise?: number;
  },
): string {
  if (sort === 'updated') {
    if (!row.updatedAt) throw new Error('INVALID_CURSOR');
    return encodeAdminProductCursor({ updatedAt: row.updatedAt, id: row.id });
  }
  if (sort === 'title_asc' || sort === 'title_desc') {
    return b64json({ k: sort, t: row.title ?? '', i: row.id });
  }
  if (sort === 'created') {
    if (!row.createdAt) throw new Error('INVALID_CURSOR');
    return b64json({ k: 'created', c: row.createdAt.toISOString(), i: row.id });
  }
  // price_*
  return b64json({ k: sort, p: row.fromPricePaise ?? 0, i: row.id });
}

export function decodeTitleCursor(sort: 'title_asc' | 'title_desc', raw: string): TitleCursor {
  const obj = parseB64json(raw);
  if (obj.k !== sort || typeof obj.t !== 'string' || typeof obj.i !== 'string') {
    throw new Error('INVALID_CURSOR');
  }
  if (!UUID_RE.test(obj.i)) throw new Error('INVALID_CURSOR');
  return { title: obj.t, id: obj.i };
}

export function decodeCreatedCursor(raw: string): CreatedCursor {
  const obj = parseB64json(raw);
  if (obj.k !== 'created' || typeof obj.c !== 'string' || typeof obj.i !== 'string') {
    throw new Error('INVALID_CURSOR');
  }
  if (!UUID_RE.test(obj.i)) throw new Error('INVALID_CURSOR');
  const createdAt = new Date(obj.c);
  if (Number.isNaN(createdAt.getTime())) throw new Error('INVALID_CURSOR');
  return { createdAt, id: obj.i };
}

export function decodePriceCursor(
  sort: 'price_asc' | 'price_desc',
  raw: string,
): PriceCursor {
  const obj = parseB64json(raw);
  if (obj.k !== sort || typeof obj.i !== 'string' || typeof obj.p !== 'number') {
    throw new Error('INVALID_CURSOR');
  }
  if (!UUID_RE.test(obj.i) || !Number.isFinite(obj.p)) throw new Error('INVALID_CURSOR');
  return { pricePaise: obj.p, id: obj.i };
}

export function titleKeysetAfter(
  sort: 'title_asc' | 'title_desc',
  cursor: TitleCursor,
): { OR: Array<Record<string, unknown>> } {
  if (sort === 'title_asc') {
    return {
      OR: [
        { title: { gt: cursor.title } },
        { AND: [{ title: cursor.title }, { id: { gt: cursor.id } }] },
      ],
    };
  }
  return {
    OR: [
      { title: { lt: cursor.title } },
      { AND: [{ title: cursor.title }, { id: { lt: cursor.id } }] },
    ],
  };
}

export function createdKeysetAfter(cursor: CreatedCursor): {
  OR: Array<Record<string, unknown>>;
} {
  return {
    OR: [
      { createdAt: { lt: cursor.createdAt } },
      { AND: [{ createdAt: cursor.createdAt }, { id: { lt: cursor.id } }] },
    ],
  };
}

/** In-memory price rank: keep rows strictly after cursor. */
export function priceRankAfter<T extends { fromPricePaise: number; id: string }>(
  sort: 'price_asc' | 'price_desc',
  rows: T[],
  cursor: PriceCursor,
): T[] {
  const idx = rows.findIndex((r) => r.id === cursor.id && r.fromPricePaise === cursor.pricePaise);
  if (idx >= 0) return rows.slice(idx + 1);
  // Cursor product drifted (price change) — find first row past cursor order.
  return rows.filter((r) => {
    if (sort === 'price_asc') {
      return (
        r.fromPricePaise > cursor.pricePaise ||
        (r.fromPricePaise === cursor.pricePaise && r.id > cursor.id)
      );
    }
    return (
      r.fromPricePaise < cursor.pricePaise ||
      (r.fromPricePaise === cursor.pricePaise && r.id < cursor.id)
    );
  });
}
