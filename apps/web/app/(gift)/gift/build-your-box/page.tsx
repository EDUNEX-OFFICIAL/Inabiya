'use client';

import Link from 'next/link';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';
import { formatInr } from '@/lib/catalog';
import { ProductBrandLine } from '@/components/gift/product-brand-line';
import { GiftListSkeleton } from '@/components/gift/gift-skeletons';

type GiftBox = {
  id: string;
  name: string;
  budgetPaise: number | null;
  recipient: string | null;
  ageBand: string | null;
  occasion: string | null;
  categorySlugs: string[];
  wizardStep: number;
  subtotalPaise: number;
  remainingBudgetPaise: number | null;
  overBudgetPaise?: number;
  brandNames?: string[];
  items: Array<{
    id: string;
    productTitle: string;
    label: string;
    quantity: number;
    lineTotalPaise: number;
    brandName?: string | null;
  }>;
};

type Suggestion = {
  variantId: string;
  productSlug: string;
  productTitle: string;
  label: string;
  pricePaise: number;
  imageUrl: string | null;
  available: number;
};

const STEPS = ['Who', 'Age', 'Occasion', 'Budget', 'Categories', 'Your box'] as const;

const RECIPIENTS = [
  { value: 'girl', label: 'Baby girl' },
  { value: 'boy', label: 'Baby boy' },
  { value: 'mom', label: 'Expecting mom' },
  { value: 'unisex', label: 'Unisex / either' },
] as const;

const AGES = [
  { value: 'newborn', label: 'Newborn (0–3m)' },
  { value: 'infant', label: 'Infant (3–12m)' },
  { value: 'toddler', label: 'Toddler (1–3y)' },
  { value: 'any', label: 'Any age' },
] as const;

const OCCASIONS = [
  { value: 'welcome-baby', label: 'Welcome baby' },
  { value: 'baby-shower', label: 'Baby shower' },
  { value: 'naming', label: 'Naming ceremony' },
  { value: 'birthday', label: 'Birthday' },
] as const;

const CATEGORIES = [
  { value: 'clothing', label: 'Clothing' },
  { value: 'bath-skin', label: 'Bath & Skin' },
  { value: 'toys', label: 'Toys' },
  { value: 'mom-care', label: 'Mom Care' },
  { value: 'newborn', label: 'Newborn' },
  { value: 'keepsakes', label: 'Keepsakes' },
] as const;

export default function GiftBoxPage() {
  return (
    <Suspense fallback={<GiftListSkeleton label="Loading gift box" />}>
      <GiftBoxWizard />
    </Suspense>
  );
}

function GiftBoxWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const skipResumeGate = searchParams.get('continue') === '1';
  const prefFromUrlApplied = useRef(false);
  const [box, setBox] = useState<GiftBox | null>(null);
  const [budget, setBudget] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  /** When a prior session left a filled step-6 box, ask before dumping into review. */
  const [resumeChoice, setResumeChoice] = useState(false);

  const loadSuggestions = useCallback(async (b: GiftBox) => {
    try {
      const res = await apiAuth<{ suggestions: Suggestion[] }>(
        `/catalog/gift-boxes/${b.id}/recommendations`,
      );
      setSuggestions(res.suggestions);
    } catch {
      setSuggestions([]);
    }
  }, []);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace('/login?next=/gift/build-your-box');
      return;
    }
    apiAuth<GiftBox>('/catalog/gift-boxes/active')
      .then(async (b) => {
        // Empty abandoned review → start wizard fresh (e.g. leftover step 6 after cart)
        if (b.wizardStep >= 6 && b.items.length === 0) {
          const fresh = await apiAuth<GiftBox>('/catalog/gift-boxes/reset', { method: 'POST' });
          setBox(fresh);
          setBudget('');
          setResumeChoice(false);
          return;
        }
        setBox(b);
        if (b.budgetPaise != null) setBudget(String(b.budgetPaise / 100));
        else setBudget('');
        // Prior completed/in-review box → don't silently dump into step 6
        // (skip when returning from PDP "Add to box" via ?continue=1)
        if (
          !skipResumeGate &&
          b.wizardStep >= 6 &&
          (b.items.length > 0 || b.recipient || b.budgetPaise != null)
        ) {
          setResumeChoice(true);
          return;
        }
        if (b.wizardStep >= 6) void loadSuggestions(b);
      })
      .catch(() => router.replace('/login?next=/gift/build-your-box'));
  }, [router, loadSuggestions, skipResumeGate]);

  async function savePrefs(
    patch: Partial<{
      recipient: string | null;
      ageBand: string | null;
      occasion: string | null;
      budgetPaise: number;
      categorySlugs: string[];
      wizardStep: number;
    }>,
  ) {
    if (!box) return;
    setError(null);
    try {
      const updated = await apiAuth<GiftBox>('/catalog/gift-boxes', {
        method: 'POST',
        json: patch,
      });
      setBox(updated);
      if (updated.wizardStep >= 6) await loadSuggestions(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
    }
  }

  /** Collection CTAs may pass ?recipient=&age=&occasion= to prefill a fresh wizard. */
  useEffect(() => {
    if (!box || resumeChoice || prefFromUrlApplied.current) return;
    if (box.recipient || box.wizardStep > 1) return;
    const recipient = searchParams.get('recipient');
    const age = searchParams.get('age');
    const occasion = searchParams.get('occasion');
    if (!recipient && !age && !occasion) return;
    const allowedR = new Set(['girl', 'boy', 'mom', 'unisex']);
    const allowedA = new Set(['newborn', 'infant', 'toddler', 'any']);
    const allowedO = new Set(['welcome-baby', 'baby-shower', 'naming', 'birthday']);
    const patch: {
      recipient?: string | null;
      ageBand?: string | null;
      occasion?: string | null;
      wizardStep: number;
    } = { wizardStep: 1 };
    if (recipient && allowedR.has(recipient)) {
      patch.recipient = recipient;
      patch.wizardStep = 2;
    }
    if (age && allowedA.has(age)) {
      patch.ageBand = age;
      if (patch.wizardStep < 3) patch.wizardStep = 3;
    }
    if (occasion && allowedO.has(occasion)) {
      patch.occasion = occasion;
      if (patch.wizardStep < 4) patch.wizardStep = 4;
    }
    prefFromUrlApplied.current = true;
    void savePrefs(patch);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- apply URL prefs once per fresh box
  }, [box, resumeChoice, searchParams]);

  async function restartWizard() {
    setBusy(true);
    setError(null);
    try {
      const next = await apiAuth<GiftBox>('/catalog/gift-boxes/reset', { method: 'POST' });
      setBox(next);
      setBudget('');
      setSuggestions([]);
      setResumeChoice(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not restart');
    } finally {
      setBusy(false);
    }
  }

  async function continueExistingBox() {
    if (!box) return;
    setResumeChoice(false);
    await loadSuggestions(box);
  }

  async function setBudgetOnBox() {
    const budgetPaise = Math.round(Number(budget) * 100);
    if (!Number.isFinite(budgetPaise) || budgetPaise < 0) return;
    await savePrefs({ budgetPaise, wizardStep: 5 });
  }

  async function removeItem(itemId: string) {
    if (!box) return;
    const updated = await apiAuth<GiftBox>(`/catalog/gift-boxes/${box.id}/items/${itemId}`, {
      method: 'DELETE',
    });
    setBox(updated);
    await loadSuggestions(updated);
  }

  async function addSuggestion(variantId: string) {
    if (!box) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await apiAuth<GiftBox>(`/catalog/gift-boxes/${box.id}/items`, {
        method: 'POST',
        json: { variantId, quantity: 1 },
      });
      setBox(updated);
      await loadSuggestions(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add item');
    } finally {
      setBusy(false);
    }
  }

  async function moveToCart() {
    if (!box || box.items.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      await apiAuth(`/catalog/gift-boxes/${box.id}/move-to-cart`, { method: 'POST' });
      router.push('/gift/cart');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not move to cart');
    } finally {
      setBusy(false);
    }
  }

  if (!box) {
    return <GiftListSkeleton label="Loading gift box" />;
  }

  const step = Math.min(6, Math.max(1, box.wizardStep || 1));
  const over =
    (box.overBudgetPaise ?? 0) > 0 ||
    (box.remainingBudgetPaise != null && box.remainingBudgetPaise < 0);

  return (
    <main className="gift-page max-w-3xl">
      <Link href="/gift" className="gift-link text-body">
        ← Gift home
      </Link>
      <p className="gift-overline mt-gs-4">Personalised</p>
      <h1 className="gift-h1 mt-gs-2">Build Your Box</h1>
      <p className="gift-muted mt-gs-2">
        Six gentle steps — budget-first, age-appropriate picks.
      </p>

      <ol className="-mx-gs-1 mt-gs-6 flex gap-gs-2 overflow-x-auto px-gs-1 pb-gs-1 text-caption sm:flex-wrap sm:overflow-visible">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const active = !resumeChoice && n === step;
          const done = !resumeChoice && n < step;
          const canJump = !resumeChoice && done;
          return (
            <li key={label} className="shrink-0">
              {canJump ? (
                <button
                  type="button"
                  className="clay-chip opacity-90"
                  onClick={() => void savePrefs({ wizardStep: n })}
                >
                  {n}. {label}
                </button>
              ) : (
                <span
                  className={`inline-block rounded-pill px-gs-3 py-gs-2 ${
                    active
                      ? 'bg-primary text-white shadow-clay'
                      : done
                        ? 'clay-chip opacity-90'
                        : 'border border-border opacity-50'
                  }`}
                >
                  {n}. {label}
                </span>
              )}
            </li>
          );
        })}
      </ol>

      {error ? <p className="mt-gs-4 text-body text-danger">{error}</p> : null}

      {resumeChoice ? (
        <section className="mt-gs-6 space-y-gs-4">
          <h2 className="gift-h2">Continue your box?</h2>
          <p className="text-body opacity-80">
            You already started a gift box
            {box.recipient || box.ageBand || box.occasion || box.budgetPaise != null ? (
              <>
                {' '}
                ({[box.recipient, box.ageBand, box.occasion].filter(Boolean).join(' · ')}
                {box.budgetPaise != null ? ` · Budget ${formatInr(box.budgetPaise)}` : ''}
                {box.items.length ? ` · ${box.items.length} item(s)` : ''})
              </>
            ) : null}
            . Pick up where you left off, or start fresh from step 1.
          </p>
          <div className="flex flex-wrap gap-gs-3">
            <button
              type="button"
              className="clay-btn"
              disabled={busy}
              onClick={() => void continueExistingBox()}
            >
              Continue this box
            </button>
            <button
              type="button"
              className="clay-btn-secondary"
              disabled={busy}
              onClick={() => void restartWizard()}
            >
              Start over
            </button>
          </div>
        </section>
      ) : null}

      {!resumeChoice && step === 1 ? (
        <section className="mt-gs-6">
          <h2 className="gift-h2">Who is it for?</h2>
          {box.items.length > 0 ? (
            <p className="mt-gs-2 text-body opacity-80">
              You already have {box.items.length} item(s) in this box.{' '}
              <button
                type="button"
                className="underline"
                onClick={() => void savePrefs({ wizardStep: 6 })}
              >
                Skip to your box
              </button>
            </p>
          ) : null}
          <div className="mt-gs-4 grid gap-gs-2 sm:grid-cols-2">
            {RECIPIENTS.map((r) => (
              <button
                key={r.value}
                type="button"
                className={`clay-card px-gs-4 py-gs-3 text-left text-body ${
                  box.recipient === r.value ? 'ring-2 ring-[var(--primary)]' : ''
                }`}
                onClick={() => void savePrefs({ recipient: r.value, wizardStep: 2 })}
              >
                {r.label}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {!resumeChoice && step === 2 ? (
        <section className="mt-gs-6">
          <h2 className="gift-h2">Baby age</h2>
          <div className="mt-gs-4 grid gap-gs-2 sm:grid-cols-2">
            {AGES.map((a) => (
              <button
                key={a.value}
                type="button"
                className={`clay-card px-gs-4 py-gs-3 text-left text-body ${
                  box.ageBand === a.value ? 'ring-2 ring-[var(--primary)]' : ''
                }`}
                onClick={() => void savePrefs({ ageBand: a.value, wizardStep: 3 })}
              >
                {a.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="mt-gs-4 text-body underline opacity-70"
            onClick={() => void savePrefs({ wizardStep: 1 })}
          >
            Back
          </button>
        </section>
      ) : null}

      {!resumeChoice && step === 3 ? (
        <section className="mt-gs-6">
          <h2 className="gift-h2">Occasion</h2>
          <div className="mt-gs-4 grid gap-gs-2 sm:grid-cols-2">
            {OCCASIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                className={`clay-card px-gs-4 py-gs-3 text-left text-body ${
                  box.occasion === o.value ? 'ring-2 ring-[var(--primary)]' : ''
                }`}
                onClick={() => void savePrefs({ occasion: o.value, wizardStep: 4 })}
              >
                {o.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="mt-gs-4 text-body underline opacity-70"
            onClick={() => void savePrefs({ wizardStep: 2 })}
          >
            Back
          </button>
        </section>
      ) : null}

      {!resumeChoice && step === 4 ? (
        <section className="mt-gs-6">
          <h2 className="gift-h2">Budget</h2>
          <p className="gift-muted mt-gs-1 text-body">We never add items that go over this amount.</p>
          <div className="mt-gs-4 flex flex-wrap gap-gs-2 items-end">
            <label className="text-body">
              Budget (₹)
              <input
                className="clay-input !mt-gs-1 max-w-[10rem]"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                inputMode="numeric"
              />
            </label>
            <button type="button" className="clay-btn" onClick={() => void setBudgetOnBox()}>
              Continue
            </button>
          </div>
          <button
            type="button"
            className="mt-gs-4 text-body underline opacity-70"
            onClick={() => void savePrefs({ wizardStep: 3 })}
          >
            Back
          </button>
        </section>
      ) : null}

      {!resumeChoice && step === 5 ? (
        <section className="mt-gs-6">
          <h2 className="gift-h2">Categories</h2>
          <p className="gift-muted mt-gs-1 text-body">Pick one or more (optional).</p>
          <div className="mt-gs-4 flex flex-wrap gap-gs-2">
            {CATEGORIES.map((c) => {
              const on = box.categorySlugs.includes(c.value);
              return (
                <button
                  key={c.value}
                  type="button"
                  className={
                    on
                      ? 'rounded-pill bg-primary px-gs-3 py-gs-2 text-body font-medium text-primary-foreground shadow-clay'
                      : 'clay-chip text-body'
                  }
                  onClick={() => {
                    const next = on
                      ? box.categorySlugs.filter((s) => s !== c.value)
                      : [...box.categorySlugs, c.value];
                    void savePrefs({ categorySlugs: next });
                  }}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
          <div className="mt-gs-6 flex gap-gs-3">
            <button
              type="button"
              className="clay-btn"
              onClick={() => void savePrefs({ wizardStep: 6 })}
            >
              See my box
            </button>
            <button
              type="button"
              className="text-body underline opacity-70"
              onClick={() => void savePrefs({ wizardStep: 4 })}
            >
              Back
            </button>
          </div>
        </section>
      ) : null}

      {!resumeChoice && step === 6 ? (
        <section className="mt-gs-6 space-y-gs-6">
          <div>
            <h2 className="gift-h2">Your box</h2>
            <p className="gift-muted mt-gs-1 text-body">
              {box.recipient ?? '—'} · {box.ageBand ?? '—'} · {box.occasion ?? '—'} · Budget{' '}
              {box.budgetPaise != null ? formatInr(box.budgetPaise) : 'not set'}
            </p>
            <ProductBrandLine
              brands={
                box.brandNames?.length
                  ? box.brandNames
                  : box.items
                      .map((i) => i.brandName)
                      .filter((b): b is string => Boolean(b?.trim()))
              }
              className="mt-gs-2"
            />
            <div className="mt-gs-3 flex flex-wrap items-baseline gap-gs-3">
              {box.remainingBudgetPaise != null ? (
                <p className="text-lg font-semibold text-foreground">
                  Remaining {formatInr(Math.max(0, box.remainingBudgetPaise))}
                </p>
              ) : null}
              <p className="text-body opacity-70">Subtotal {formatInr(box.subtotalPaise)}</p>
              {over ? (
                <p className="text-body text-danger">
                  Over by {formatInr(box.overBudgetPaise ?? 0)}
                </p>
              ) : null}
            </div>
          </div>

          <ul className="space-y-gs-2 text-body">
            {box.items.length === 0 ? (
              <li className="opacity-70">No items yet — add from recommendations below.</li>
            ) : (
              box.items.map((i) => (
                <li
                  key={i.id}
                  className="flex justify-between gap-gs-4 border-b border-border-subtle py-gs-2"
                >
                  <span>
                    {i.productTitle} ({i.label}) × {i.quantity}
                  </span>
                  <span className="flex gap-gs-3">
                    {formatInr(i.lineTotalPaise)}
                    <button
                      type="button"
                      className="underline opacity-70"
                      onClick={() => void removeItem(i.id)}
                    >
                      Remove
                    </button>
                  </span>
                </li>
              ))
            )}
          </ul>

          <div>
            <h3 className="font-medium text-body mb-gs-2">Recommended within budget</h3>
            {suggestions.length === 0 ? (
              <p className="text-body opacity-70">
                No matches within remaining budget —{' '}
                <Link href="/gift/products" className="underline">
                  browse all products
                </Link>
                .
              </p>
            ) : (
              <ul className="grid gap-gs-3 sm:grid-cols-2">
                {suggestions.map((s) => (
                  <li key={s.variantId} className="clay-card p-gs-3 text-body">
                    <Link
                      href={`/gift/products/${s.productSlug}`}
                      className="font-medium hover:text-primary"
                    >
                      {s.productTitle}
                    </Link>
                    <p className="opacity-70">
                      {s.label} · {formatInr(s.pricePaise)}
                    </p>
                    <button
                      type="button"
                      disabled={busy || over}
                      className="clay-btn-secondary mt-gs-2 !min-h-0 !px-gs-3 !py-1 text-caption disabled:opacity-50"
                      onClick={() => void addSuggestion(s.variantId)}
                    >
                      Add to box
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-wrap gap-gs-3 items-center">
            <button
              type="button"
              disabled={busy || box.items.length === 0 || over}
              onClick={() => void moveToCart()}
              className="clay-btn disabled:opacity-50"
            >
              {busy ? 'Moving…' : 'Add box to cart'}
            </button>
            <Link href="/gift/products" className="clay-btn-secondary">
              Browse more
            </Link>
            <button
              type="button"
              disabled={busy}
              className="text-body underline opacity-70 disabled:opacity-40"
              onClick={() => void restartWizard()}
            >
              Start over
            </button>
          </div>
        </section>
      ) : null}
    </main>
  );
}
