'use client';

import Link from 'next/link';
import { FormEvent, Suspense, useEffect, useId, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiAuth, getStoredAccessToken, loginUrl } from '@/lib/auth-client';
import { cartApi, fetchCart, formatCartCoupons, formatInr, type CartDto } from '@/lib/cart-client';
import { CartCouponField } from '@/components/gift/cart-coupon-field';
import { buyNowCartItems, parseBuyNowVariantId } from '@/lib/buy-now';
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
  couponLabel?: string | null;
  couponCodes?: string[];
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

type RazorpayCheckoutResult = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: {
      key: string;
      amount: number;
      currency: string;
      name: string;
      description: string;
      order_id: string;
      handler: (response: RazorpayCheckoutResult) => void;
      modal: { ondismiss: () => void };
    }) => { open: () => void };
  }
}

function openRazorpayCheckout(input: {
  keyId: string;
  orderId: string;
  amountPaise: number;
}): Promise<RazorpayCheckoutResult> {
  return new Promise((resolve, reject) => {
    const open = () => {
      if (!window.Razorpay) {
        reject(new Error('Payment checkout could not be loaded.'));
        return;
      }
      const checkout = new window.Razorpay({
        key: input.keyId,
        amount: input.amountPaise,
        currency: 'INR',
        name: 'Inabiya',
        description: 'Order payment',
        order_id: input.orderId,
        handler: resolve,
        modal: { ondismiss: () => reject(new Error('Payment was cancelled.')) },
      });
      checkout.open();
    };

    if (window.Razorpay) {
      open();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = open;
    script.onerror = () => reject(new Error('Payment checkout could not be loaded.'));
    document.head.appendChild(script);
  });
}

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

function CheckoutPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const buyNowVariantId = parseBuyNowVariantId(searchParams.get('buyNow'));
  const buyNowItemId = parseBuyNowVariantId(searchParams.get('buyNowItem'));
  const checkoutNext = buyNowVariantId
    ? `/checkout?buyNow=${buyNowVariantId}${buyNowItemId ? `&buyNowItem=${buyNowItemId}` : ''}`
    : '/checkout';
  const shipGroupId = useId();
  const addrGroupId = useId();
  const [gate, setGate] = useState<Gate>('checking');
  const [cart, setCart] = useState<CartDto | null>(null);
  const [quotes, setQuotes] = useState<Record<ShippingMethod, Preview> | null>(null);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [addressMode, setAddressMode] = useState<'saved' | 'new'>('new');
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('STANDARD');
  const [saveAddress, setSaveAddress] = useState(true);
  const [couponDraft, setCouponDraft] = useState('');
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [couponBusy, setCouponBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const preview = quotes?.[shippingMethod] ?? null;

  async function loadQuotes(token: string, couponCode?: string | null) {
    const extra = buyNowVariantId ? { buyNowVariantId, buyNowItemId } : {};
    const [standard, express] = await Promise.all([
      cartApi<Preview>('/checkout/preview', {
        method: 'POST',
        authToken: token,
        json: { shippingMethod: 'STANDARD', couponCode: couponCode ?? undefined, ...extra },
      }),
      cartApi<Preview>('/checkout/preview', {
        method: 'POST',
        authToken: token,
        json: { shippingMethod: 'EXPRESS', couponCode: couponCode ?? undefined, ...extra },
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
        setCouponDraft('');
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
        if (!buyNowCartItems(c.items, buyNowVariantId, buyNowItemId).length) {
          setGate('empty');
          return;
        }
        await loadQuotes(token);
        setGate('ready');
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Could not load checkout');
        setGate('error');
      });
  }, [buyNowItemId, buyNowVariantId]);

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
      setCouponDraft('');
      await loadQuotes(token);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid coupon');
    } finally {
      setCouponBusy(false);
    }
  }

  async function removeCoupon(code?: string) {
    const token = getStoredAccessToken();
    if (!token) return;
    setCouponBusy(true);
    setError(null);
    try {
      const qs = code ? `?code=${encodeURIComponent(code)}` : '';
      const updated = await cartApi<CartDto>(`/cart/coupon${qs}`, {
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
        provider: string;
        totalPaise: number;
        confirmUrl: string;
        razorpay?: { keyId: string; orderId: string };
      }>('/checkout/place-order', {
        method: 'POST',
        authToken: getStoredAccessToken(),
        json: {
          shippingMethod,
          shippingAddress: { ...form, country: 'IN' },
          couponCode: cart?.couponCode ?? undefined,
          saveAddress: addressMode === 'new' && saveAddress,
          buyNowVariantId,
          buyNowItemId,
        },
      });
      if (result.provider === 'razorpay' && result.razorpay) {
        const response = await openRazorpayCheckout({
          keyId: result.razorpay.keyId,
          orderId: result.razorpay.orderId,
          amountPaise: result.totalPaise,
        });
        await apiAuth(`/checkout/payments/${result.paymentId}/razorpay/verify`, {
          method: 'POST',
          json: response,
        });
      } else if (result.provider === 'mock') {
        await apiAuth(`/checkout/payments/${result.paymentId}/confirm`, { method: 'POST' });
      } else {
        throw new Error('Payment provider is unavailable.');
      }
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
          <Link href={loginUrl(checkoutNext)} className="clay-btn w-full justify-center">
            Sign in
          </Link>
          <Link
            href={`/register?next=${encodeURIComponent(checkoutNext)}`}
            className="clay-btn-secondary w-full justify-center"
          >
            Create account
          </Link>
        </div>
        <Link href="/cart" className="mt-gs-5 inline-block gift-link text-body">
          ← Cart
        </Link>
      </main>
    );
  }

  if (gate === 'empty') {
    return (
      <main className="gift-page max-w-md">
        <h1 className="gift-h1">{buyNowVariantId ? 'Item not in cart' : 'Cart is empty'}</h1>
        <Link href="/products" className="clay-btn mt-gs-6 inline-flex w-full justify-center">
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
          <Link href="/cart" className="gift-link">
            Cart
          </Link>
          <Link href={loginUrl(checkoutNext)} className="gift-link">
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  const displayCart = {
    ...cart,
    items: buyNowCartItems(cart.items, buyNowVariantId, buyNowItemId),
  };
  const itemCount = displayCart.items.reduce((n, i) => n + i.quantity, 0);
  const payLabel = busy ? 'Placing order…' : `Pay ${formatInr(preview.totalPaise)}`;
  const showAddressForm = addressMode === 'new' || addresses.length === 0;

  return (
    <main className="gift-page pb-0 lg:pb-[var(--space-7)]">
      <nav
        className="flex flex-wrap items-center gap-gs-2 text-caption"
        aria-label="Checkout progress"
      >
        <Link href="/cart" className="gift-link">
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
          cart={displayCart}
          preview={preview}
          couponDraft={couponDraft}
          couponBusy={couponBusy}
          open={summaryOpen}
          onToggle={() => setSummaryOpen((v) => !v)}
          onCouponDraft={setCouponDraft}
          onApplyCoupon={() => void applyCoupon()}
          onRemoveCoupon={(code) => void removeCoupon(code)}
          className="mb-gs-5 lg:hidden"
        />

        <div className="grid items-start gap-gs-6 lg:grid-cols-[minmax(0,1fr)_min(24rem,38%)] xl:grid-cols-[minmax(0,1fr)_26rem]">
          <div className="checkout-form-col min-w-0 space-y-gs-4 lg:pb-0">
            <section className="checkout-section" aria-labelledby="checkout-delivery">
              <h2 id="checkout-delivery" className="gift-h2">
                Delivery
              </h2>
              {addresses.length > 0 ? (
                <div
                  className="mt-gs-4 space-y-gs-3"
                  role="radiogroup"
                  aria-labelledby="checkout-delivery"
                >
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
                              <span className="ml-gs-2 text-caption font-normal opacity-60">
                                Default
                              </span>
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
              <div
                className="mt-gs-4 space-y-gs-3"
                role="radiogroup"
                aria-labelledby="checkout-shipping"
              >
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
              {displayCart.items.some(
                (item) => item.giftExtras?.note || item.giftExtras?.wrap || item.giftExtras?.ribbon,
              ) ? (
                <ul className="mt-gs-4 space-y-gs-3 text-body">
                  {displayCart.items.map((item) => {
                    const extras = item.giftExtras;
                    if (!extras?.note && !extras?.wrap && !extras?.ribbon) return null;
                    return (
                      <li
                        key={item.id}
                        className="rounded-control border border-border-subtle px-gs-3 py-gs-2"
                      >
                        <p className="font-medium">{item.productTitle}</p>
                        {extras.note ? (
                          <p className="mt-gs-1 opacity-75">
                            {extras.note.label}: {extras.note.value}
                          </p>
                        ) : null}
                        {extras.wrap ? (
                          <p className="mt-gs-1 opacity-75">Wrap: {extras.wrap.label}</p>
                        ) : null}
                        {extras.ribbon ? (
                          <p className="mt-gs-1 opacity-75">Ribbon: {extras.ribbon.label}</p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-gs-3 text-body opacity-70">No gift extras selected.</p>
              )}
              <Link href="/cart" className="gift-link mt-gs-3 inline-flex text-body">
                Review cart
              </Link>
            </section>

            <section className="checkout-section" aria-labelledby="checkout-pay">
              <h2 id="checkout-pay" className="gift-h2">
                Payment
              </h2>
              <div className="checkout-option mt-gs-4" data-selected="true">
                <span
                  className="mt-1 size-4 shrink-0 rounded-full border border-primary bg-primary"
                  aria-hidden
                />
                <span className="min-w-0 text-body">
                  <span className="font-medium text-foreground">
                    {(process.env.NEXT_PUBLIC_PAYMENT_PROVIDER ?? 'mock') === 'razorpay'
                      ? 'Online payment'
                      : 'Mock payment'}
                  </span>
                  <span className="mt-gs-1 block opacity-70">
                    {(process.env.NEXT_PUBLIC_PAYMENT_PROVIDER ?? 'mock') === 'razorpay'
                      ? 'UPI, cards, netbanking'
                      : 'No card is charged'}
                  </span>
                </span>
              </div>
              <p className="mt-gs-4 text-caption opacity-70">
                Ship to {form.fullName || '—'} ·{' '}
                {SHIPPING_OPTIONS.find((o) => o.code === shippingMethod)?.title}
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
            cart={displayCart}
            preview={preview}
            couponDraft={couponDraft}
            couponBusy={couponBusy}
            open
            sticky
            itemCount={itemCount}
            onCouponDraft={setCouponDraft}
            onApplyCoupon={() => void applyCoupon()}
            onRemoveCoupon={(code) => void removeCoupon(code)}
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

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutSkeleton />}>
      <CheckoutPageInner />
    </Suspense>
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
  onRemoveCoupon: (code?: string) => void;
}) {
  const count = itemCount ?? cart.items.reduce((n, i) => n + i.quantity, 0);
  const discountLabel =
    preview.couponLabel ?? formatCartCoupons(cart) ?? preview.couponCode;

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
            <span className="text-body font-semibold text-primary">
              {formatInr(preview.totalPaise)}
            </span>
          </button>
        ) : (
          <div className="flex items-baseline justify-between gap-gs-3">
            <h2 className="gift-h2">Order summary</h2>
            <p className="text-caption opacity-70">
              {count} item{count === 1 ? '' : 's'}
            </p>
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

            <div className="mt-gs-4">
              <CartCouponField
                cart={cart}
                draft={couponDraft}
                busy={couponBusy}
                inputClassName={`${inputClass} !mt-gs-1`}
                onDraft={onCouponDraft}
                onApply={onApplyCoupon}
                onRemove={onRemoveCoupon}
              />
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
                  <dt>Discount{discountLabel ? ` (${discountLabel})` : ''}</dt>
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
