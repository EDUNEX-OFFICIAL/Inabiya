import { apiAuth, getStoredAccessToken, subscribeAuthChanged } from '@/lib/auth-client';

type WishlistRow = { variantId: string };

let ids: Set<string> | null = null;
let inflight: Promise<Set<string>> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function subscribeWishlist(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

export function wishlistHas(variantId: string): boolean {
  return ids?.has(variantId) ?? false;
}

export async function ensureWishlistLoaded(): Promise<void> {
  if (!getStoredAccessToken()) {
    ids = new Set();
    return;
  }
  if (ids) return;
  if (!inflight) {
    inflight = apiAuth<WishlistRow[]>('/catalog/wishlist')
      .then((rows) => {
        ids = new Set(Array.isArray(rows) ? rows.map((r) => r.variantId) : []);
        return ids;
      })
      .catch(() => {
        ids = new Set();
        return ids;
      })
      .finally(() => {
        inflight = null;
      });
  }
  await inflight;
}

export async function toggleWishlist(variantId: string): Promise<'added' | 'removed' | 'login'> {
  if (!getStoredAccessToken()) return 'login';
  await ensureWishlistLoaded();
  const set = ids ?? new Set<string>();
  if (set.has(variantId)) {
    await apiAuth(`/catalog/wishlist/${variantId}`, { method: 'DELETE' });
    set.delete(variantId);
    ids = set;
    emit();
    return 'removed';
  }
  await apiAuth('/catalog/wishlist', { method: 'POST', json: { variantId } });
  set.add(variantId);
  ids = set;
  emit();
  return 'added';
}

export async function removeWishlist(variantId: string): Promise<void> {
  await apiAuth(`/catalog/wishlist/${variantId}`, { method: 'DELETE' });
  ids?.delete(variantId);
  emit();
}

if (typeof window !== 'undefined') {
  subscribeAuthChanged(() => {
    ids = null;
    inflight = null;
    emit();
  });
}
