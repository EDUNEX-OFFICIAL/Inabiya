'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredAccessToken } from '@/lib/auth-client';
import { cartApi, fetchCart, formatInr, type CartDto } from '@/lib/cart-client';

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartDto | null>(null);
  const [coupon, setCoupon] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCart(getStoredAccessToken())
      .then((c) => {
        setCart(c);
        if (c.couponCode) setCoupon(c.couponCode);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load cart'));
  }, []);

  async function updateQty(itemId: string, quantity: number) {
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
    }
  }

  async function remove(itemId: string) {
    try {
      const updated = await cartApi<CartDto>(`/cart/items/${itemId}`, {
        method: 'DELETE',
        authToken: getStoredAccessToken(),
      });
      setCart(updated);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove item');
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
    return <main className="gift-page max-w-3xl text-sm opacity-70">Loading cart…</main>;
  }

  return (
    <main className="gift-page max-w-3xl">
      <Link href="/gift" className="gift-link text-sm">
        ← Continue shopping
      </Link>
      <h1 className="gift-h1 mt-gs-4">Your cart</h1>

      {cart.items.length === 0 ? (
        <div className="clay-panel mt-gs-6 p-gs-6 text-center">
          <p className="text-sm opacity-80">Cart is empty.</p>
          <Link href="/gift/products" className="clay-btn mt-gs-5 inline-flex">
            Browse gifts
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-gs-6 space-y-gs-4">
            {cart.items.map((item) => (
              <li
                key={item.id}
                className="clay-card flex flex-wrap items-center justify-between gap-gs-4 p-gs-5"
              >
                <div>
                  <Link
                    href={`/gift/products/${item.productSlug}`}
                    className="font-medium hover:text-primary"
                  >
                    {item.productTitle}
                  </Link>
                  <p className="text-sm opacity-70">
                    {item.label} · {formatInr(item.unitPricePaise)}
                  </p>
                </div>
                <div className="flex items-center gap-gs-3">
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={item.quantity}
                    onChange={(e) => void updateQty(item.id, Number(e.target.value) || 1)}
                    className="clay-input !mt-0 w-16"
                  />
                  <span className="font-medium text-primary">
                    {formatInr(item.lineTotalPaise)}
                  </span>
                  <button
                    type="button"
                    onClick={() => void remove(item.id)}
                    className="text-sm text-danger underline"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="clay-panel mt-gs-6 p-gs-4 sm:p-gs-5">
            <div className="flex flex-col gap-gs-2 sm:flex-row sm:flex-wrap sm:items-end">
              <label className="block flex-1 text-sm">
                Coupon
                <input
                  className="clay-input"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="WELCOME10"
                  disabled={Boolean(cart.couponCode)}
                />
              </label>
              {cart.couponCode ? (
                <button
                  type="button"
                  onClick={() => void removeCoupon()}
                  className="clay-btn-ghost text-danger"
                >
                  Remove coupon
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

            <div className="mt-gs-5 space-y-gs-1 text-sm">
              <p>Subtotal: {formatInr(cart.subtotalPaise)}</p>
              {(cart.discountPaise ?? 0) > 0 ? (
                <p className="text-success">
                  Discount ({cart.couponCode}): −{formatInr(cart.discountPaise!)}
                </p>
              ) : null}
              {cart.couponRemoved ? (
                <p className="text-warning">
                  {cart.couponRemovedReason ?? 'Coupon removed — no longer valid for this cart.'}
                </p>
              ) : null}
              <p className="pt-gs-2 text-lg font-semibold text-foreground">
                Total: {formatInr(cart.totalPaise ?? cart.subtotalPaise)}
              </p>
            </div>
            {error ? <p className="text-sm text-danger mt-gs-2">{error}</p> : null}

            <button
              type="button"
              onClick={() => {
                if (!getStoredAccessToken()) {
                  router.push('/login?next=/checkout');
                  return;
                }
                router.push('/checkout');
              }}
              className="clay-btn mt-gs-6 w-full justify-center sm:w-auto"
            >
              {getStoredAccessToken() ? 'Proceed to checkout' : 'Sign in to checkout'}
            </button>
            {!getStoredAccessToken() ? (
              <p className="mt-gs-2 text-xs opacity-70">
                Checkout needs a customer account. Cart is kept until you sign in.
              </p>
            ) : null}
          </div>
        </>
      )}
    </main>
  );
}
