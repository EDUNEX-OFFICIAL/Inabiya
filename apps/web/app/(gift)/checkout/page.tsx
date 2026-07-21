'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';
import { cartApi, fetchCart, formatInr, type CartDto } from '@/lib/cart-client';
import { trackEvent } from '@/lib/analytics';

type Preview = {
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  taxPaise: number;
  totalPaise: number;
  couponCode: string | null;
};

type SavedAddress = {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
};

type Gate = 'checking' | 'need_login' | 'empty' | 'ready' | 'error';

const FIELD_LABELS: Record<string, string> = {
  fullName: 'Full name',
  phone: 'Phone',
  line1: 'Address line 1',
  line2: 'Address line 2 (optional)',
  city: 'City',
  state: 'State',
  postalCode: 'PIN code',
};

const inputClass = 'clay-input';

export default function CheckoutPage() {
  const router = useRouter();
  const [gate, setGate] = useState<Gate>('checking');
  const [cart, setCart] = useState<CartDto | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [shippingMethod, setShippingMethod] = useState<'STANDARD' | 'EXPRESS'>('STANDARD');
  const [giftMessage, setGiftMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
  });

  useEffect(() => {
    const token = getStoredAccessToken();
    if (!token) {
      setGate('need_login');
      return;
    }
    trackEvent('begin_checkout');
    Promise.all([
      fetchCart(token),
      apiAuth<SavedAddress[]>('/addresses').catch(() => [] as SavedAddress[]),
    ])
      .then(([c, addrs]) => {
        setCart(c);
        setAddresses(addrs);
        const def = addrs.find((a) => a.isDefault) ?? addrs[0];
        if (def) {
          setSelectedAddressId(def.id);
          setForm({
            fullName: def.fullName,
            phone: def.phone,
            line1: def.line1,
            line2: def.line2 ?? '',
            city: def.city,
            state: def.state,
            postalCode: def.postalCode,
          });
        }
        if (!c.items.length) {
          setGate('empty');
          return;
        }
        return cartApi<Preview>('/checkout/preview', {
          method: 'POST',
          authToken: token,
          json: { shippingMethod, couponCode: c.couponCode ?? undefined },
        }).then((p) => {
          setPreview(p);
          setGate('ready');
        });
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Could not load checkout');
        setGate('error');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (gate !== 'ready' || !cart?.items.length) return;
    const token = getStoredAccessToken();
    if (!token) return;
    cartApi<Preview>('/checkout/preview', {
      method: 'POST',
      authToken: token,
      json: { shippingMethod, couponCode: cart.couponCode ?? undefined },
    })
      .then(setPreview)
      .catch((e) => setError(e instanceof Error ? e.message : 'Preview failed'));
  }, [shippingMethod, gate, cart]);

  function applySavedAddress(id: string) {
    setSelectedAddressId(id);
    const a = addresses.find((x) => x.id === id);
    if (!a) return;
    setForm({
      fullName: a.fullName,
      phone: a.phone,
      line1: a.line1,
      line2: a.line2 ?? '',
      city: a.city,
      state: a.state,
      postalCode: a.postalCode,
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await cartApi<{
        orderId: string;
        orderNumber: string;
        paymentId: string;
        confirmUrl: string;
      }>('/checkout/place-order', {
        method: 'POST',
        authToken: getStoredAccessToken(),
        json: {
          shippingMethod,
          shippingAddress: { ...form, country: 'IN' },
          giftMessage: giftMessage || undefined,
          couponCode: cart?.couponCode ?? undefined,
          saveAddress: !selectedAddressId,
        },
      });
      await apiAuth(`/checkout/payments/${result.paymentId}/confirm`, { method: 'POST' });
      trackEvent('purchase', { orderId: result.orderId });
      router.push(`/orders/${result.orderId}?placed=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setBusy(false);
    }
  }

  if (gate === 'checking') {
    return <main className="gift-page max-w-xl text-sm opacity-70">Preparing checkout…</main>;
  }

  if (gate === 'need_login') {
    return (
      <main className="gift-page max-w-md">
        <div className="clay-panel p-gs-5 sm:p-gs-6">
          <h1 className="gift-h2 sm:text-3xl">Sign in to checkout</h1>
          <p className="mt-gs-3 text-sm opacity-80">
            Checkout needs an account so we can save your order and address. Cart items stay on this
            device until you sign in.
          </p>
          <div className="mt-gs-6 flex w-full flex-col gap-gs-3 text-sm sm:w-auto sm:flex-row sm:flex-wrap">
            <Link href="/login?next=/checkout" className="clay-btn w-full justify-center sm:w-auto">
              Sign in
            </Link>
            <Link
              href="/register?next=/checkout"
              className="clay-btn-secondary w-full justify-center sm:w-auto"
            >
              Create account
            </Link>
          </div>
          <Link href="/gift/cart" className="mt-gs-5 inline-block gift-link text-sm">
            ← Back to cart
          </Link>
        </div>
      </main>
    );
  }

  if (gate === 'empty') {
    return (
      <main className="gift-page max-w-md">
        <div className="clay-panel p-gs-5 text-center sm:p-gs-6">
          <h1 className="gift-h2 sm:text-3xl">Cart is empty</h1>
          <p className="mt-gs-3 text-sm opacity-80">Add something from the gift shop before checkout.</p>
          <Link href="/gift/products" className="clay-btn mt-gs-6 inline-flex w-full justify-center sm:w-auto">
            Browse gifts
          </Link>
        </div>
      </main>
    );
  }

  if (gate === 'error' || !cart || !preview) {
    return (
      <main className="gift-page max-w-md">
        <div className="clay-panel p-gs-5 sm:p-gs-6">
          <h1 className="gift-h2 sm:text-3xl">Checkout unavailable</h1>
          <p className="mt-gs-3 text-sm text-danger">{error ?? 'Something went wrong.'}</p>
          <div className="mt-gs-6 flex gap-gs-4 text-sm">
            <Link href="/gift/cart" className="hover:text-primary">
              Back to cart
            </Link>
            <Link href="/login?next=/checkout" className="hover:text-primary">
              Sign in again
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="gift-page max-w-xl">
      <Link href="/gift/cart" className="gift-link text-sm">
        ← Back to cart
      </Link>
      <h1 className="gift-h1 mt-gs-4">Checkout</h1>
      <p className="mt-gs-2 text-sm opacity-70">{cart.items.length} item(s) ready to gift</p>

      <form onSubmit={onSubmit} className="clay-panel mt-gs-6 space-y-gs-4 p-gs-4 sm:p-gs-6">
        <fieldset className="space-y-gs-3">
          <legend className="font-display text-xl">Shipping address</legend>
          {addresses.length > 0 ? (
            <label className="block text-sm">
              Saved address
              <select
                className={inputClass}
                value={selectedAddressId}
                onChange={(e) => applySavedAddress(e.target.value)}
              >
                {addresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.fullName} — {a.line1}, {a.city}
                    {a.isDefault ? ' (default)' : ''}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {(['fullName', 'phone', 'line1', 'line2', 'city', 'state', 'postalCode'] as const).map(
            (key) => (
              <label key={key} className="block text-sm">
                {FIELD_LABELS[key]}
                <input
                  required={key !== 'line2'}
                  placeholder={FIELD_LABELS[key]}
                  value={form[key]}
                  onChange={(e) => {
                    setSelectedAddressId('');
                    setForm((f) => ({ ...f, [key]: e.target.value }));
                  }}
                  className={inputClass}
                />
              </label>
            ),
          )}
        </fieldset>

        <label className="block text-sm">
          Shipping method
          <select
            className={inputClass}
            value={shippingMethod}
            onChange={(e) => setShippingMethod(e.target.value as 'STANDARD' | 'EXPRESS')}
          >
            <option value="STANDARD">Standard (free over ₹2,000)</option>
            <option value="EXPRESS">Express</option>
          </select>
        </label>

        <label className="block text-sm">
          Gift message
          <textarea
            className={inputClass}
            rows={2}
            value={giftMessage}
            onChange={(e) => setGiftMessage(e.target.value)}
          />
        </label>

        <div className="clay-card space-y-gs-1 p-gs-4 text-sm">
          <p>Subtotal: {formatInr(preview.subtotalPaise)}</p>
          {preview.discountPaise > 0 ? (
            <p className="text-success">Discount: −{formatInr(preview.discountPaise)}</p>
          ) : null}
          <p>Shipping: {formatInr(preview.shippingPaise)}</p>
          <p className="pt-gs-2 text-lg font-semibold text-foreground">
            Total: {formatInr(preview.totalPaise)}
          </p>
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <button type="submit" disabled={busy} className="clay-btn w-full sm:w-auto disabled:opacity-60">
          {busy ? 'Placing order…' : 'Pay & place order'}
        </button>
      </form>
    </main>
  );
}
