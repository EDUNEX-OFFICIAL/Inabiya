'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';
import { cartApi, fetchCart, formatInr, type CartDto } from '@/lib/cart-client';
import { trackEvent } from '@/lib/analytics';
import { CheckoutSkeleton } from '@/components/gift/gift-skeletons';
import { LineThumb } from '@/components/gift/line-thumb';

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
type ShippingMethod = 'STANDARD' | 'EXPRESS';

const FIELD_LABELS: Record<string, string> = {
  fullName: 'Full name',
  phone: 'Phone',
  line1: 'Address line 1',
  line2: 'Address line 2',
  city: 'City',
  state: 'State',
  postalCode: 'PIN code',
};

const AUTOCOMPLETE: Record<string, string> = {
  fullName: 'name',
  phone: 'tel',
  line1: 'address-line1',
  line2: 'address-line2',
  city: 'address-level2',
  state: 'address-level1',
  postalCode: 'postal-code',
};

const SHIPPING_OPTIONS: Array<{
  code: ShippingMethod;
  title: string;
  eta: string;
}> = [
  { code: 'STANDARD', title: 'Standard', eta: '3–5 days' },
  { code: 'EXPRESS', title: 'Express', eta: '1–2 days' },
];

const emptyForm = {
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
};

const inputClass = 'clay-input';

export default function CheckoutPage() {
  const router = useRouter();
  const shipGroupId = useId();
  const addrGroupId = useId();
  const [gate, setGate] = useState<Gate>('checking');
  const [cart, setCart] = useState<CartDto | null>(null);
  const [quotes, setQuotes] = useState<Record<ShippingMethod, Preview> | null>(null);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [addressMode, setAddressMode] = useState<'saved' | 'new'>('new');
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('STANDARD');
  const [giftMessage, setGiftMessage] = useState('');
  const [giftWrap, setGiftWrap] = useState(false);
  const [saveAddress, setSaveAddress] = useState(true);
  const [couponDraft, setCouponDraft] = useState('');
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [couponBusy, setCouponBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const preview = quotes?.[shippingMethod] ?? null;

  async function loadQuotes(token: string, couponCode?: string | null) {
    const [standard, express] = await Promise.all([
      cartApi<Preview>('/checkout/preview', {
        method: 'POST',
        authToken: token,
        json: { shippingMethod: 'STANDARD', couponCode: couponCode ?? undefined },
      }),
      cartApi<Preview>('/checkout/preview', {
        method: 'POST',
        authToken: token,
        json: { shippingMethod: 'EXPRESS', couponCode: couponCode ?? undefined },
      }),
    ]);
    setQuotes({ STANDARD: standard, EXPRESS: express });
  }

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
      .then(async ([c, addrs]) => {
        setCart(c);
        setAddresses(addrs);
        if (c.couponCode) setCouponDraft(c.couponCode);
        const def = addrs.find((a) => a.isDefault) ?? addrs[0];
        if (def) {
          setSelectedAddressId(def.id);
          setAddressMode('saved');
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
        await loadQuotes(token, c.couponCode);
        setGate('ready');
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Could not load checkout');
        setGate('error');
      });
  }, []);

  function applySavedAddress(id: string) {
    setSelectedAddressId(id);
    setAddressMode('saved');
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

  function startNewAddress() {
    setSelectedAddressId('');
    setAddressMode('new');
    setForm(emptyForm);
  }

  function patchForm(key: keyof typeof emptyForm, value: string) {
    if (addressMode === 'saved') {
      setSelectedAddressId('');
      setAddressMode('new');
    }
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function applyCoupon() {
    const code = couponDraft.trim();
    if (!code) {
      setError('Enter a coupon code');
      return;
    }
    const token = getStoredAccessToken();
    if (!token) return;
    setCouponBusy(true);
    setError(null);
    try {
      const updated = await cartApi<CartDto>('/cart/coupon', {
        method: 'POST',
        json: { code },
        authToken: token,
      });
      setCart(updated);
      setCouponDraft(updated.couponCode ?? code.toUpperCase());
      await loadQuotes(token, updated.couponCode);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid coupon');
    } finally {
      setCouponBusy(false);
    }
  }

  async function removeCoupon() {
    const token = getStoredAccessToken();
    if (!token) return;
    setCouponBusy(true);
    setError(null);
    try {
      const updated = await cartApi<CartDto>('/cart/coupon', {
        method: 'DELETE',
        authToken: token,
      });
      setCart(updated);
      setCouponDraft('');
      await loadQuotes(token, null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove coupon');
    } finally {
      setCouponBusy(false);
    }
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
          giftMessage: giftMessage.trim() || undefined,
          giftWrap,
          couponCode: cart?.couponCode ?? undefined,
          saveAddress: addressMode === 'new' && saveAddress,
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
    return <CheckoutSkeleton />;
  }

  if (gate === 'need_login') {
    return (
      <main className="gift-page max-w-md">
        <h1 className="gift-h1">Sign in to checkout</h1>
        <div className="mt-gs-6 flex w-full flex-col gap-gs-3 text-body">
          <Link href="/login?next=/checkout" className="clay-btn w-full justify-center">
            Sign in
          </Link>
          <Link href="/register?next=/checkout" className="clay-btn-secondary w-full justify-center">
            Create account
          </Link>
        </div>
        <Link href="/gift/cart" className="mt-gs-5 inline-block gift-link text-body">
          ← Cart
        </Link>
      </main>
    );
  }

  if (gate === 'empty') {
    return (
      <main className="gift-page max-w-md">
        <h1 className="gift-h1">Cart is empty</h1>
        <Link href="/gift/products" className="clay-btn mt-gs-6 inline-flex w-full justify-center">
          Browse gifts
        </Link>
      </main>
    );
  }

  if (gate === 'error' || !cart || !preview) {
    return (
      <main className="gift-page max-w-md">
        <h1 className="gift-h1">Checkout unavailable</h1>
        <p className="mt-gs-3 text-body text-danger">{error ?? 'Something went wrong.'}</p>
        <div className="mt-gs-6 flex gap-gs-4 text-body">
          <Link href="/gift/cart" className="gift-link">
            Cart
          </Link>
          <Link href="/login?next=/checkout" className="gift-link">
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  const itemCount = cart.items.reduce((n, i) => n + i.quantity, 0);
  const payLabel = busy ? 'Placing order…' : `Pay ${formatInr(preview.totalPaise)}`;
  const showAddressForm = addressMode === 'new' || addresses.length === 0;

  return (
    <main className="gift-page pb-0 lg:pb-[var(--space-7)]">
      <nav className="flex flex-wrap items-center gap-gs-2 text-caption" aria-label="Checkout progress">
        <Link href="/gift/cart" className="gift-link">
          Cart
        </Link>
        <span className="opacity-40" aria-hidden>
          /
        </span>
        <span className="font-semibold text-foreground">Checkout</span>
      </nav>
      <h1 className="gift-h1 mt-gs-4">Checkout</h1>

      <form onSubmit={onSubmit} className="mt-gs-5" autoComplete="on">
        <OrderSummaryPanel
          cart={cart}
          preview={preview}
          couponDraft={couponDraft}
          couponBusy={couponBusy}
          open={summaryOpen}
          onToggle={() => setSummaryOpen((v) => !v)}
          onCouponDraft={setCouponDraft}
          onApplyCoupon={() => void applyCoupon()}
          onRemoveCoupon={() => void removeCoupon()}
          className="mb-gs-5 lg:hidden"
        />

        <div className="grid items-start gap-gs-6 lg:grid-cols-[minmax(0,1fr)_min(24rem,38%)] xl:grid-cols-[minmax(0,1fr)_26rem]">
          <div className="checkout-form-col min-w-0 space-y-gs-4 lg:pb-0">
            <section className="checkout-section" aria-labelledby="checkout-delivery">
              <h2 id="checkout-delivery" className="gift-h2">
                Delivery
              </h2>
              {addresses.length > 0 ? (
                <div className="mt-gs-4 space-y-gs-3" role="radiogroup" aria-labelledby="checkout-delivery">
                  {addresses.map((a) => {
                    const selected = addressMode === 'saved' && selectedAddressId === a.id;
                    return (
                      <label
                        key={a.id}
                        className="checkout-option"
                        data-selected={selected ? 'true' : 'false'}
                      >
                        <input
                          type="radio"
                          name={addrGroupId}
                          className="mt-1 size-4 accent-[var(--primary)]"
                          checked={selected}
                          onChange={() => applySavedAddress(a.id)}
                        />
                        <span className="min-w-0 flex-1 text-body">
                          <span className="font-medium text-foreground">
                            {a.fullName}
                            {a.isDefault ? (
                              <span className="ml-gs-2 text-caption font-normal opacity-60">Default</span>
                            ) : null}
                          </span>
                          <span className="mt-gs-1 block opacity-70">
                            {a.line1}
                            {a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} {a.postalCode}
                          </span>
                          <span className="mt-gs-1 block opacity-70">{a.phone}</span>
                        </span>
                      </label>
                    );
                  })}
                  <label
                    className="checkout-option"
                    data-selected={addressMode === 'new' ? 'true' : 'false'}
                  >
                    <input
                      type="radio"
                      name={addrGroupId}
                      className="mt-1 size-4 accent-[var(--primary)]"
                      checked={addressMode === 'new'}
                      onChange={startNewAddress}
                    />
                    <span className="text-body font-medium">New address</span>
                  </label>
                </div>
              ) : null}

              {showAddressForm ? (
                <div className="mt-gs-4 space-y-gs-3">
                  <label className="block text-body">
                    {FIELD_LABELS.fullName}
                    <input
                      required
                      name="name"
                      autoComplete={AUTOCOMPLETE.fullName}
                      placeholder={FIELD_LABELS.fullName}
                      value={form.fullName}
                      onChange={(e) => patchForm('fullName', e.target.value)}
                      className={inputClass}
                    />
                  </label>
                  <label className="block text-body">
                    {FIELD_LABELS.phone}
                    <input
                      required
                      type="tel"
                      name="tel"
                      inputMode="tel"
                      autoComplete={AUTOCOMPLETE.phone}
                      placeholder={FIELD_LABELS.phone}
                      value={form.phone}
                      onChange={(e) => patchForm('phone', e.target.value)}
                      className={inputClass}
                    />
                  </label>
                  <label className="block text-body">
                    {FIELD_LABELS.line1}
                    <input
                      required
                      name="address-line1"
                      autoComplete={AUTOCOMPLETE.line1}
                      placeholder={FIELD_LABELS.line1}
                      value={form.line1}
                      onChange={(e) => patchForm('line1', e.target.value)}
                      className={inputClass}
                    />
                  </label>
                  <label className="block text-body">
                    {FIELD_LABELS.line2}
                    <input
                      name="address-line2"
                      autoComplete={AUTOCOMPLETE.line2}
                      placeholder={FIELD_LABELS.line2}
                      value={form.line2}
                      onChange={(e) => patchForm('line2', e.target.value)}
                      className={inputClass}
                    />
                  </label>
                  <div className="grid gap-gs-3 sm:grid-cols-2">
                    <label className="block text-body">
                      {FIELD_LABELS.city}
                      <input
                        required
                        name="address-level2"
                        autoComplete={AUTOCOMPLETE.city}
                        placeholder={FIELD_LABELS.city}
                        value={form.city}
                        onChange={(e) => patchForm('city', e.target.value)}
                        className={inputClass}
                      />
                    </label>
                    <label className="block text-body">
                      {FIELD_LABELS.state}
                      <input
                        required
                        name="address-level1"
                        autoComplete={AUTOCOMPLETE.state}
                        placeholder={FIELD_LABELS.state}
                        value={form.state}
                        onChange={(e) => patchForm('state', e.target.value)}
                        className={inputClass}
                      />
                    </label>
                  </div>
                  <label className="block max-w-xs text-body">
                    {FIELD_LABELS.postalCode}
                    <input
                      required
                      name="postal-code"
                      inputMode="numeric"
                      autoComplete={AUTOCOMPLETE.postalCode}
                      placeholder={FIELD_LABELS.postalCode}
                      value={form.postalCode}
                      onChange={(e) => patchForm('postalCode', e.target.value)}
                      className={inputClass}
                    />
                  </label>
                  <label className="mt-gs-2 flex items-center gap-gs-3 text-body">
                    <input
                      type="checkbox"
                      className="size-4 accent-[var(--primary)]"
                      checked={saveAddress}
                      onChange={(e) => setSaveAddress(e.target.checked)}
                    />
                    Save this address
                  </label>
                </div>
              ) : null}
            </section>

            <section className="checkout-section" aria-labelledby="checkout-shipping">
              <h2 id="checkout-shipping" className="gift-h2">
                Shipping
              </h2>
              <div className="mt-gs-4 space-y-gs-3" role="radiogroup" aria-labelledby="checkout-shipping">
                {SHIPPING_OPTIONS.map((opt) => {
                  const selected = shippingMethod === opt.code;
                  const price = quotes?.[opt.code]?.shippingPaise ?? 0;
                  return (
                    <label
                      key={opt.code}
                      className="checkout-option"
                      data-selected={selected ? 'true' : 'false'}
                    >
                      <input
                        type="radio"
                        name={shipGroupId}
                        className="mt-1 size-4 accent-[var(--primary)]"
                        checked={selected}
                        onChange={() => setShippingMethod(opt.code)}
                      />
                      <span className="min-w-0 flex-1 text-body">
                        <span className="font-medium text-foreground">{opt.title}</span>
                        <span className="mt-gs-1 block opacity-70">{opt.eta}</span>
                      </span>
                      <span className="shrink-0 text-body font-medium text-foreground">
                        {price === 0 ? 'Free' : formatInr(price)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>

            <section className="checkout-section" aria-labelledby="checkout-gift">
              <h2 id="checkout-gift" className="gift-h2">
                Gift
              </h2>
              <label className="mt-gs-4 flex items-center gap-gs-3 text-body">
                <input
                  type="checkbox"
                  className="size-4 accent-[var(--primary)]"
                  checked={giftWrap}
                  onChange={(e) => setGiftWrap(e.target.checked)}
                />
                Gift wrap
              </label>
              <label className="mt-gs-3 block text-body">
                Gift message
                <textarea
                  className={inputClass}
                  rows={2}
                  maxLength={500}
                  name="gift-message"
                  placeholder="Happy birthday"
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                />
              </label>
            </section>

            <section className="checkout-section" aria-labelledby="checkout-pay">
              <h2 id="checkout-pay" className="gift-h2">
                Payment
              </h2>
              <div className="checkout-option mt-gs-4" data-selected="true">
                <span className="mt-1 size-4 shrink-0 rounded-full border border-primary bg-primary" aria-hidden />
                <span className="min-w-0 text-body">
                  <span className="font-medium text-foreground">Mock payment</span>
                  <span className="mt-gs-1 block opacity-70">No card is charged</span>
                </span>
              </div>
              <p className="mt-gs-4 text-caption opacity-70">
                Ship to {form.fullName || '—'} · {SHIPPING_OPTIONS.find((o) => o.code === shippingMethod)?.title}
              </p>
              {error ? (
                <p className="mt-gs-3 text-body text-danger" role="alert">
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={busy}
                className="clay-btn mt-gs-5 hidden w-full justify-center disabled:opacity-60 lg:inline-flex"
              >
                {payLabel}
              </button>
            </section>

            <p className="flex items-center justify-center gap-gs-2 pb-gs-4 text-caption opacity-60 lg:justify-start">
              <LockTiny />
              Encrypted checkout
            </p>
          </div>

          <OrderSummaryPanel
            cart={cart}
            preview={preview}
            couponDraft={couponDraft}
            couponBusy={couponBusy}
            open
            sticky
            itemCount={itemCount}
            onCouponDraft={setCouponDraft}
            onApplyCoupon={() => void applyCoupon()}
            onRemoveCoupon={() => void removeCoupon()}
            className="hidden lg:block"
          />
        </div>

        <div className="checkout-sticky-pay lg:hidden">
          {error ? (
            <p className="mb-gs-2 text-caption text-danger" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={busy}
            className="clay-btn w-full justify-center disabled:opacity-60"
          >
            {payLabel}
          </button>
        </div>
      </form>
    </main>
  );
}

function OrderSummaryPanel({
  cart,
  preview,
  couponDraft,
  couponBusy,
  open = true,
  sticky = false,
  itemCount,
  className = '',
  onToggle,
  onCouponDraft,
  onApplyCoupon,
  onRemoveCoupon,
}: {
  cart: CartDto;
  preview: Preview;
  couponDraft: string;
  couponBusy: boolean;
  open?: boolean;
  sticky?: boolean;
  itemCount?: number;
  className?: string;
  onToggle?: () => void;
  onCouponDraft: (v: string) => void;
  onApplyCoupon: () => void;
  onRemoveCoupon: () => void;
}) {
  const count = itemCount ?? cart.items.reduce((n, i) => n + i.quantity, 0);
  const applied = Boolean(cart.couponCode);

  return (
    <aside
      className={`${sticky ? 'lg:sticky lg:top-[calc(var(--gift-sticky-offset,4.5rem)+var(--space-4))]' : ''} ${className}`}
    >
      <div className="checkout-section checkout-section--soft">
        {onToggle ? (
          <button
            type="button"
            className="flex w-full items-center justify-between gap-gs-3 text-left"
            onClick={onToggle}
            aria-expanded={open}
          >
            <span className="gift-h2">Order summary</span>
            <span className="text-body font-semibold text-primary">{formatInr(preview.totalPaise)}</span>
          </button>
        ) : (
          <div className="flex items-baseline justify-between gap-gs-3">
            <h2 className="gift-h2">Order summary</h2>
            <p className="text-caption opacity-70">{count} item{count === 1 ? '' : 's'}</p>
          </div>
        )}

        {open ? (
          <div className={onToggle ? 'mt-gs-4' : 'mt-gs-4'}>
            <ul className="space-y-gs-3">
              {cart.items.map((item) => (
                <li key={item.id} className="flex gap-gs-3 text-body">
                  <LineThumb imageUrl={item.imageUrl} quantity={item.quantity} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-snug">{item.productTitle}</p>
                    <p className="mt-gs-1 opacity-70">{item.label}</p>
                  </div>
                  <p className="shrink-0 font-medium">{formatInr(item.lineTotalPaise)}</p>
                </li>
              ))}
            </ul>

            <div className="mt-gs-4 flex flex-col gap-gs-2 sm:flex-row sm:items-end">
              <label className="block min-w-0 flex-1 text-body">
                Coupon
                <input
                  className={`${inputClass} !mt-gs-1`}
                  value={couponDraft}
                  onChange={(e) => onCouponDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (!applied && !couponBusy) onApplyCoupon();
                    }
                  }}
                  placeholder="Code"
                  disabled={applied || couponBusy}
                  autoCapitalize="characters"
                />
              </label>
              {applied ? (
                <button
                  type="button"
                  onClick={onRemoveCoupon}
                  disabled={couponBusy}
                  className="clay-btn-ghost text-danger disabled:opacity-60"
                >
                  Remove
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onApplyCoupon}
                  disabled={couponBusy}
                  className="clay-btn-secondary w-full sm:w-auto disabled:opacity-60"
                >
                  Apply
                </button>
              )}
            </div>
            {cart.couponRemoved ? (
              <p className="mt-gs-2 text-caption text-warning">
                {cart.couponRemovedReason ?? 'Coupon removed'}
              </p>
            ) : null}

            <dl className="mt-gs-5 space-y-gs-2 text-body">
              <div className="flex justify-between gap-gs-3">
                <dt className="opacity-70">Subtotal</dt>
                <dd>{formatInr(preview.subtotalPaise)}</dd>
              </div>
              {preview.discountPaise > 0 ? (
                <div className="flex justify-between gap-gs-3 text-success">
                  <dt>Discount{preview.couponCode ? ` (${preview.couponCode})` : ''}</dt>
                  <dd>−{formatInr(preview.discountPaise)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-gs-3">
                <dt className="opacity-70">Shipping</dt>
                <dd>{preview.shippingPaise === 0 ? 'Free' : formatInr(preview.shippingPaise)}</dd>
              </div>
              {preview.taxPaise > 0 ? (
                <div className="flex justify-between gap-gs-3">
                  <dt className="opacity-70">Tax</dt>
                  <dd>{formatInr(preview.taxPaise)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-gs-3 border-t border-border-subtle pt-gs-3 text-lg font-semibold text-foreground">
                <dt>Total</dt>
                <dd className="text-primary">{formatInr(preview.totalPaise)}</dd>
              </div>
            </dl>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

function LockTiny() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
