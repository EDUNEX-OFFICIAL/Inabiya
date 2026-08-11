'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';
import { cartApi, formatInr } from '@/lib/cart-client';
import { GiftListSkeleton } from '@/components/gift/gift-skeletons';

type WishlistRow = {
  id: string;
  variantId: string;
  product: { slug: string; title: string; imageUrl: string | null };
  sku: string;
  label: string;
  pricePaise: number;
  available: number;
};

export default function WishlistPage() {
  const router = useRouter();
  const [rows, setRows] = useState<WishlistRow[] | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  function load() {
    return apiAuth<WishlistRow[]>('/catalog/wishlist').then(setRows);
  }

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace('/login?next=/gift/wishlist');
      return;
    }
    load().catch(() => router.replace('/login?next=/gift/wishlist'));
  }, [router]);

  async function remove(variantId: string) {
    await apiAuth(`/catalog/wishlist/${variantId}`, { method: 'DELETE' });
    await load();
  }

  async function moveToCart(variantId: string) {
    setMsg(null);
    try {
      await cartApi('/cart/items', {
        method: 'POST',
        json: { variantId, quantity: 1 },
        authToken: getStoredAccessToken(),
      });
      await apiAuth(`/catalog/wishlist/${variantId}`, { method: 'DELETE' });
      setMsg('Moved to cart');
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Could not add to cart');
    }
  }

  if (!rows) {
    return <GiftListSkeleton label="Loading wishlist" />;
  }

  return (
    <main className="gift-page">
      <Link href="/gift/products" className="gift-link text-body">
        ← Continue shopping
      </Link>
      <h1 className="gift-h1 mt-gs-4">Wishlist</h1>
      <p className="mt-gs-2 text-body opacity-80">Saved gifts — move to cart when ready.</p>
      {msg ? <p className="mt-gs-3 text-body text-success">{msg}</p> : null}

      {rows.length === 0 ? (
        <div className="clay-panel mt-gs-6 p-gs-6 text-center sm:p-gs-6">
          <p className="text-body opacity-80">Wishlist is empty.</p>
          <Link href="/gift/products" className="clay-btn mt-gs-5 inline-flex">
            Browse gifts
          </Link>
        </div>
      ) : (
        <ul className="mt-gs-6 space-y-gs-4">
          {rows.map((r) => (
            <li key={r.id} className="clay-card overflow-hidden text-body sm:flex sm:items-center">
              {r.product.imageUrl ? (
                <div className="relative h-36 w-full sm:h-28 sm:w-28 sm:shrink-0">
                  <Image
                    src={r.product.imageUrl}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 112px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="h-36 w-full gift-media-fallback sm:h-28 sm:w-28 sm:shrink-0" />
              )}
              <div className="flex flex-1 flex-col gap-gs-3 p-gs-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link
                    href={`/gift/products/${r.product.slug}`}
                    className="font-medium hover:text-primary"
                  >
                    {r.product.title}
                  </Link>
                  <p className="mt-gs-1 opacity-70">
                    {r.label} · {formatInr(r.pricePaise)}
                    {r.available < 1 ? ' · out of stock' : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-gs-2">
                  <button
                    type="button"
                    disabled={r.available < 1}
                    className="clay-btn !py-gs-2 disabled:opacity-40"
                    onClick={() => void moveToCart(r.variantId)}
                  >
                    Move to cart
                  </button>
                  <button
                    type="button"
                    className="clay-btn-ghost text-danger"
                    onClick={() => void remove(r.variantId)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
