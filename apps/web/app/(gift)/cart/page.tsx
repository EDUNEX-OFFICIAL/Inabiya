'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredAccessToken } from '@/lib/auth-client';
import { cartApi, fetchCart, formatInr, type CartDto } from '@/lib/cart-client';
import { GiftListSkeleton } from '@/components/gift/gift-skeletons';
import { LineThumb } from '@/components/gift/line-thumb';

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartDto | null>(null);
  const [coupon, setCoupon] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    fetchCart(getStoredAccessToken())
      .then((c) => {
        setCart(c);
        if (c.couponCode) setCoupon(c.couponCode);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load cart'));
  }, []);

  async function updateQty(itemId: string, quantity: number) {
    if (quantity < 1 || quantity > 99) return;
    setBusyId(itemId);
    try {
      const updated = await cartApi<CartDto>(`/cart/items/${itemId}`, {
        method: 'PATCH',
        json: { quantity },
        authToken: getStoredAccessToken(),
      });
      setCart(updated);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update quantity');
    } finally {
      setBusyId(null);
    }
  }

  async function remove(itemId: string) {
    setBusyId(itemId);
    try {
      const updated = await cartApi<CartDto>(`/cart/items/${itemId}`, {
        method: 'DELETE',
        authToken: getStoredAccessToken(),
      });
      setCart(updated);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove item');
    } finally {
      setBusyId(null);
    }
  }

  async function applyCoupon() {
    const code = coupon.trim();
    if (!code) {
      setError('Enter a coupon code');
      return;
    }
    try {
      const updated = await cartApi<CartDto>('/cart/coupon', {
        method: 'POST',
        json: { code },
        authToken: getStoredAccessToken(),
      });
      setCart(updated);
      setCoupon(updated.couponCode ?? code.toUpperCase());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid coupon');
    }
  }

  async function removeCoupon() {
    try {
      const updated = await cartApi<CartDto>('/cart/coupon', {
        method: 'DELETE',
        authToken: getStoredAccessToken(),
      });
      setCart(updated);
      setCoupon('');
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove coupon');
    }
  }

  if (!cart) {
    return <GiftListSkeleton label="Loading cart" />;
  }

  const signedIn = Boolean(getStoredAccessToken());

  return (
    <main className="gift-page">
      <Link href="/" className="gift-link text-body">
        ← Continue shopping
      </Link>
      <h1 className="gift-h1 mt-gs-4">Your cart</h1>

      {cart.items.length === 0 ? (
        <div className="checkout-section mt-gs-6 text-center">
          <p className="text-body opacity-80">Cart is empty</p>
          <Link href="/products" className="clay-btn mt-gs-5 inline-flex">
            Browse gifts
          </Link>
        </div>
      ) : (
        <div className="mt-gs-6 grid items-start gap-gs-6 lg:grid-cols-[minmax(0,1fr)_min(24rem,38%)]">
          <ul className="space-y-gs-3">
            {cart.items.map((item) => {
              const busy = busyId === item.id;
              return (
                <li key={item.id} className="checkout-section flex gap-gs-4 p-gs-4">
                  <LineThumb imageUrl={item.imageUrl} quantity={item.quantity} />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/products/${item.productSlug}`}
                      className="font-medium hover:text-primary"
                    >
                      {item.productTitle}
                    </Link>
                    <p className="mt-gs-1 text-body opacity-70">
                      {item.label} · {formatInr(item.unitPricePaise)}
                      {(item.extrasPaise ?? 0) > 0
                        ? ` + extras ${formatInr(item.extrasPaise!)}`
                        : ''}
                    </p>
                    {item.giftExtras?.note || item.giftExtras?.wrap || item.giftExtras?.ribbon ? (
                      <div className="mt-gs-2 text-caption opacity-75">
                        {item.giftExtras.note ? (
                          <p>
                            {item.giftExtras.note.label}: {item.giftExtras.note.value}
                          </p>
                        ) : null}
                        {item.giftExtras.wrap ? <p>Wrap: {item.giftExtras.wrap.label}</p> : null}
                        {item.giftExtras.ribbon ? (
                          <p>Ribbon: {item.giftExtras.ribbon.label}</p>
                        ) : null}
                        <Link href={`/products/${item.productSlug}`} className="gift-link">
                          Change on product page
                        </Link>
                      </div>
                    ) : null}
                    <div className="mt-gs-3 flex flex-wrap items-center gap-gs-3">
                      <div className="flex h-10 items-center rounded-control border border-border-subtle">
                        <button
                          type="button"
                          className="px-gs-3 text-body disabled:opacity-40"
                          aria-label="Decrease quantity"
                          disabled={busy || item.quantity <= 1}
                          onClick={() => void updateQty(item.id, item.quantity - 1)}
                        >
                          −
                        </button>
                        <span className="min-w-8 text-center text-body tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          className="px-gs-3 text-body disabled:opacity-40"
                          aria-label="Increase quantity"
                          disabled={busy || item.quantity >= 99}
                          onClick={() => void updateQty(item.id, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => void remove(item.id)}
                        disabled={busy}
                        className="text-body text-danger underline disabled:opacity-40"
                      >
                        Remove
                      </button>
                      <span className="ml-auto font-medium text-primary">
                        {formatInr(item.lineTotalPaise)}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <aside className="checkout-section checkout-section--soft lg:sticky lg:top-[calc(var(--gift-sticky-offset)+var(--space-4))]">
            <h2 className="gift-h2">Summary</h2>
            <div className="mt-gs-4 flex flex-col gap-gs-2 sm:flex-row sm:items-end">
              <label className="block min-w-0 flex-1 text-body">
                Coupon
                <input
                  className="clay-input"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (!cart.couponCode) void applyCoupon();
                    }
                  }}
                  placeholder="Code"
                  disabled={Boolean(cart.couponCode)}
                  autoCapitalize="characters"
                />
              </label>
              {cart.couponCode ? (
                <button
                  type="button"
                  onClick={() => void removeCoupon()}
                  className="clay-btn-ghost text-danger"
                >
                  Remove
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void applyCoupon()}
                  className="clay-btn-secondary w-full sm:w-auto"
                >
                  Apply
                </button>
              )}
            </div>

            <dl className="mt-gs-5 space-y-gs-2 text-body">
              <div className="flex justify-between gap-gs-3">
                <dt className="opacity-70">Subtotal</dt>
                <dd>{formatInr(cart.subtotalPaise)}</dd>
              </div>
              {(cart.discountPaise ?? 0) > 0 ? (
                <div className="flex justify-between gap-gs-3 text-success">
                  <dt>Discount ({cart.couponCode})</dt>
                  <dd>−{formatInr(cart.discountPaise!)}</dd>
                </div>
              ) : null}
              {cart.couponRemoved ? (
                <p className="text-caption text-warning">
                  {cart.couponRemovedReason ?? 'Coupon removed'}
                </p>
              ) : null}
              <div className="flex justify-between gap-gs-3 border-t border-border-subtle pt-gs-3 text-lg font-semibold text-foreground">
                <dt>Total</dt>
                <dd className="text-primary">{formatInr(cart.totalPaise ?? cart.subtotalPaise)}</dd>
              </div>
            </dl>
            {error ? <p className="mt-gs-2 text-body text-danger">{error}</p> : null}

            <button
              type="button"
              onClick={() => {
                if (!signedIn) {
                  router.push('/login?next=/checkout');
                  return;
                }
                router.push('/checkout');
              }}
              className="clay-btn mt-gs-5 w-full justify-center"
            >
              {signedIn ? 'Proceed to checkout' : 'Sign in to checkout'}
            </button>
          </aside>
        </div>
      )}
    </main>
  );
}
