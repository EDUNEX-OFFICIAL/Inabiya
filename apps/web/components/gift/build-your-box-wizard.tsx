'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ForwardRefExoticComponent,
  type HTMLAttributes,
  type RefAttributes,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  BlocksIcon,
  BoxIcon,
  CartIcon,
  HandHeartIcon,
  IndianRupeeIcon,
  PartyPopperIcon,
  RabbitIcon,
  RockingChairIcon,
  SmileIcon,
  SmilePlusIcon,
  SparklesIcon,
  StampIcon,
  UserRoundPlusIcon,
  UsersIcon,
  UsersRoundIcon,
  type BoxIconHandle,
  type CartIconHandle,
} from 'lucide-animated';
import { formatInr } from '@/lib/catalog';
import {
  collectionsToOptions,
  fetchCatalogCollectionsClient,
  type CollectionOption,
} from '@/lib/catalog-collections';
import { giftBoxApi, type GiftBoxDto } from '@/lib/gift-box-client';
import { ProductBrandLine } from '@/components/gift/product-brand-line';
import { GiftListSkeleton } from '@/components/gift/gift-skeletons';
import { useOnceIcon } from '@/components/gift/use-once-icon';

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

type AnimHandle = { startAnimation: () => void; stopAnimation: () => void };
type AnimIcon = ForwardRefExoticComponent<
  HTMLAttributes<HTMLDivElement> & {
    size?: number;
    animateOnHover?: boolean;
  } & RefAttributes<AnimHandle>
>;

const RECIPIENTS = [
  { value: 'girl', label: 'Baby girl', icon: SmilePlusIcon, tone: 'blush' },
  { value: 'boy', label: 'Baby boy', icon: SmileIcon, tone: 'mint' },
  { value: 'mom', label: 'Expecting mom', icon: HandHeartIcon, tone: 'lavender' },
  { value: 'unisex', label: 'Unisex / either', icon: UsersRoundIcon, tone: 'yellow' },
] as const;

const AGES = [
  { value: 'newborn', label: 'Newborn', hint: '0–3 months', icon: RockingChairIcon },
  { value: 'infant', label: 'Infant', hint: '3–12 months', icon: RabbitIcon },
  { value: 'toddler', label: 'Toddler', hint: '1–3 years', icon: BlocksIcon },
  { value: 'any', label: 'Any age', hint: 'All ages', icon: UsersIcon },
] as const;

const OCCASIONS = [
  { value: 'welcome-baby', label: 'Welcome baby', icon: UserRoundPlusIcon },
  { value: 'baby-shower', label: 'Baby shower', icon: PartyPopperIcon },
  { value: 'naming', label: 'Naming ceremony', icon: StampIcon },
  { value: 'birthday', label: 'Birthday', icon: SparklesIcon },
] as const;

const BUDGET_PRESETS = [200000, 350000, 500000, 800000] as const;

function pickLabel(
  list: ReadonlyArray<{ value: string; label: string }>,
  value: string | null,
): string | null {
  if (!value) return null;
  return list.find((x) => x.value === value)?.label ?? value;
}

export function BuildYourBoxWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const skipResumeGate = searchParams.get('continue') === '1';
  const prefFromUrlApplied = useRef(false);
  const [box, setBox] = useState<GiftBoxDto | null>(null);
  const [budget, setBudget] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [resumeChoice, setResumeChoice] = useState(false);
  const [collectionOptions, setCollectionOptions] = useState<CollectionOption[]>([]);

  useEffect(() => {
    let cancelled = false;
    void fetchCatalogCollectionsClient().then((rows) => {
      if (!cancelled) setCollectionOptions(collectionsToOptions(rows));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadSuggestions = useCallback(async (b: GiftBoxDto) => {
    try {
      const res = await giftBoxApi<{ suggestions: Suggestion[] }>(
        `/catalog/gift-boxes/${b.id}/recommendations`,
      );
      setSuggestions(res.suggestions);
    } catch {
      setSuggestions([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    giftBoxApi<GiftBoxDto>('/catalog/gift-boxes/active')
      .then(async (b) => {
        if (cancelled) return;
        if (b.wizardStep >= 6 && b.items.length === 0) {
          const fresh = await giftBoxApi<GiftBoxDto>('/catalog/gift-boxes/reset', {
            method: 'POST',
          });
          if (cancelled) return;
          setBox(fresh);
          setBudget('');
          setResumeChoice(false);
          return;
        }
        setBox(b);
        if (b.budgetPaise != null) setBudget(String(b.budgetPaise / 100));
        else setBudget('');
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
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Could not load gift box');
      });
    return () => {
      cancelled = true;
    };
  }, [loadSuggestions, skipResumeGate]);

  async function savePrefs(
    patch: Partial<{
      recipient: string | null;
      ageBand: string | null;
      occasion: string | null;
      budgetPaise: number;
      collectionSlugs: string[];
      wizardStep: number;
    }>,
  ) {
    if (!box) return;
    setError(null);
    try {
      const updated = await giftBoxApi<GiftBoxDto>('/catalog/gift-boxes', {
        method: 'POST',
        json: patch,
      });
      setBox(updated);
      if (updated.wizardStep >= 6) await loadSuggestions(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
    }
  }

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
      const next = await giftBoxApi<GiftBoxDto>('/catalog/gift-boxes/reset', { method: 'POST' });
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

  async function setBudgetOnBox(budgetPaise?: number) {
    const paise = budgetPaise ?? Math.round(Number(budget) * 100);
    if (!Number.isFinite(paise) || paise <= 0) {
      setError('Enter a budget');
      return;
    }
    setBudget(String(paise / 100));
    await savePrefs({ budgetPaise: paise, wizardStep: 5 });
  }

  async function removeItem(itemId: string) {
    if (!box) return;
    setError(null);
    try {
      const updated = await giftBoxApi<GiftBoxDto>(
        `/catalog/gift-boxes/${box.id}/items/${itemId}`,
        {
          method: 'DELETE',
        },
      );
      setBox(updated);
      await loadSuggestions(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove item');
    }
  }

  async function addSuggestion(variantId: string) {
    if (!box) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await giftBoxApi<GiftBoxDto>(`/catalog/gift-boxes/${box.id}/items`, {
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
      await giftBoxApi(`/catalog/gift-boxes/${box.id}/move-to-cart`, { method: 'POST' });
      router.push('/gift/cart');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not move to cart');
    } finally {
      setBusy(false);
    }
  }

  if (!box) {
    return error ? (
      <main className="gift-page">
        <p className="text-body text-danger">{error}</p>
      </main>
    ) : (
      <GiftListSkeleton label="Loading gift box" />
    );
  }

  const step = Math.min(6, Math.max(1, box.wizardStep || 1));
  const over =
    (box.overBudgetPaise ?? 0) > 0 ||
    (box.remainingBudgetPaise != null && box.remainingBudgetPaise < 0);
  const usedRatio =
    box.budgetPaise != null && box.budgetPaise > 0
      ? Math.min(1.2, box.subtotalPaise / box.budgetPaise)
      : 0;
  const meterClass = over || usedRatio > 1 ? 'is-over' : usedRatio >= 0.85 ? 'is-warn' : '';

  const who = pickLabel(RECIPIENTS, box.recipient);
  const age = pickLabel(AGES, box.ageBand);
  const occasion = pickLabel(OCCASIONS, box.occasion);

  return (
    <main className="gift-page">
      <Link href="/gift" className="gift-link text-body">
        ← Gift home
      </Link>
      <h1 className="gift-h1 mt-gs-4">Build Your Box</h1>

      {!resumeChoice ? (
        <div className="mt-gs-5">
          <div className="flex items-baseline justify-between gap-gs-3">
            <p className="text-caption opacity-60">
              Step {step} of {STEPS.length}
            </p>
            {step > 1 ? (
              <button
                type="button"
                className="text-body underline opacity-70"
                onClick={() => void savePrefs({ wizardStep: step - 1 })}
              >
                Back
              </button>
            ) : null}
          </div>
          <div
            className="byb-progress-track mt-gs-2"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={STEPS.length}
            aria-valuenow={step}
            aria-label={`Step ${step} of ${STEPS.length}: ${STEPS[step - 1]}`}
          >
            <div
              className="byb-progress-fill"
              style={{ width: `${(step / STEPS.length) * 100}%` }}
            />
          </div>
          <ol className="mt-gs-3 flex flex-wrap gap-gs-1">
            {STEPS.map((label, i) => {
              const n = i + 1;
              const done = n < step;
              const active = n === step;
              return (
                <li key={label}>
                  {done ? (
                    <button
                      type="button"
                      className="rounded-pill px-gs-2 py-gs-1 text-caption opacity-80 hover:opacity-100"
                      onClick={() => void savePrefs({ wizardStep: n })}
                    >
                      {label}
                    </button>
                  ) : (
                    <span
                      aria-current={active ? 'step' : undefined}
                      className={`rounded-pill px-gs-2 py-gs-1 text-caption ${
                        active ? 'bg-primary text-white' : 'opacity-40'
                      }`}
                    >
                      {label}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
          {who || age || occasion || box.budgetPaise != null ? (
            <p className="mt-gs-3 flex flex-wrap gap-gs-1 lg:hidden">
              {who ? <span className="clay-chip text-caption">{who}</span> : null}
              {age ? <span className="clay-chip text-caption">{age}</span> : null}
              {occasion ? <span className="clay-chip text-caption">{occasion}</span> : null}
              {box.budgetPaise != null ? (
                <span className="clay-chip text-caption">{formatInr(box.budgetPaise)}</span>
              ) : null}
            </p>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="mt-gs-4 text-body text-danger">{error}</p> : null}

      {resumeChoice ? (
        <section className="mt-gs-6 space-y-gs-4">
          <h2 className="gift-h2">Continue your box?</h2>
          <p className="text-body opacity-80">
            {[who, age, occasion].filter(Boolean).join(' · ')}
            {box.budgetPaise != null ? ` · ${formatInr(box.budgetPaise)}` : ''}
            {box.items.length ? ` · ${box.items.length} item(s)` : ''}
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
      ) : (
        <div
          className={`mt-gs-6 grid items-start gap-gs-6 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-gs-7 ${step === 6 ? 'pb-20 lg:pb-0' : ''}`}
        >
          <div className="byb-step min-w-0" key={step}>
            {step === 1 ? (
              <section>
                <h2 className="gift-h2">Who is it for?</h2>
                {box.items.length > 0 ? (
                  <p className="mt-gs-2 text-body opacity-80">
                    {box.items.length} item(s) already in this box.{' '}
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
                    <ChoiceTile
                      key={r.value}
                      pressed={box.recipient === r.value}
                      tone={r.tone}
                      icon={r.icon}
                      label={r.label}
                      onClick={() => void savePrefs({ recipient: r.value, wizardStep: 2 })}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {step === 2 ? (
              <section>
                <h2 className="gift-h2">Baby age</h2>
                <div className="mt-gs-4 grid gap-gs-2 sm:grid-cols-2">
                  {AGES.map((a) => (
                    <ChoiceTile
                      key={a.value}
                      pressed={box.ageBand === a.value}
                      compact
                      icon={a.icon}
                      label={a.label}
                      hint={a.hint}
                      onClick={() => void savePrefs({ ageBand: a.value, wizardStep: 3 })}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {step === 3 ? (
              <section>
                <h2 className="gift-h2">Occasion</h2>
                <div className="mt-gs-4 grid gap-gs-2 sm:grid-cols-2">
                  {OCCASIONS.map((o) => (
                    <ChoiceTile
                      key={o.value}
                      pressed={box.occasion === o.value}
                      icon={o.icon}
                      label={o.label}
                      onClick={() => void savePrefs({ occasion: o.value, wizardStep: 4 })}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {step === 4 ? (
              <section>
                <h2 className="gift-h2">Budget</h2>
                <div className="mt-gs-4 grid grid-cols-2 gap-gs-2">
                  {BUDGET_PRESETS.map((paise) => (
                    <ChoiceTile
                      key={paise}
                      pressed={box.budgetPaise === paise}
                      compact
                      icon={IndianRupeeIcon}
                      label={formatInr(paise)}
                      onClick={() => void setBudgetOnBox(paise)}
                    />
                  ))}
                </div>
                <div className="mt-gs-4 flex flex-wrap items-end gap-gs-2">
                  <label className="text-body">
                    Custom (₹)
                    <input
                      className="clay-input !mt-gs-1 max-w-[10rem]"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      inputMode="numeric"
                    />
                  </label>
                  <button
                    type="button"
                    className="clay-btn"
                    disabled={!budget.trim() || Number(budget) <= 0}
                    onClick={() => void setBudgetOnBox()}
                  >
                    Continue
                  </button>
                </div>
              </section>
            ) : null}

            {step === 5 ? (
              <section>
                <h2 className="gift-h2">Categories</h2>
                <div className="mt-gs-4 flex flex-wrap gap-gs-2">
                  {collectionOptions.map((c) => {
                    const on = box.collectionSlugs.includes(c.value);
                    return (
                      <button
                        key={c.value}
                        type="button"
                        aria-pressed={on}
                        className={
                          on
                            ? 'rounded-pill bg-primary px-gs-3 py-gs-2 text-body font-medium text-primary-foreground shadow-clay'
                            : 'clay-chip text-body'
                        }
                        onClick={() => {
                          const next = on
                            ? box.collectionSlugs.filter((s) => s !== c.value)
                            : [...box.collectionSlugs, c.value];
                          void savePrefs({ collectionSlugs: next });
                        }}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  className="clay-btn mt-gs-6"
                  onClick={() => void savePrefs({ wizardStep: 6 })}
                >
                  See my box
                </button>
              </section>
            ) : null}

            {step === 6 ? (
              <section className="space-y-gs-6">
                <div>
                  <h2 className="gift-h2">Your box</h2>
                  <p className="gift-muted mt-gs-1 text-body">
                    {[who, age, occasion].filter(Boolean).join(' · ') || '—'}
                    {box.budgetPaise != null ? ` · ${formatInr(box.budgetPaise)}` : ''}
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
                </div>

                <ul className="space-y-gs-2">
                  {box.items.length === 0 ? (
                    <li className="text-body opacity-70">No items yet.</li>
                  ) : (
                    box.items.map((i) => (
                      <li
                        key={i.id}
                        className="flex items-center gap-gs-3 border-b border-border-subtle py-gs-2 text-body"
                      >
                        {i.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={i.imageUrl}
                            alt=""
                            className="size-12 shrink-0 rounded-control object-cover"
                          />
                        ) : (
                          <span className="size-12 shrink-0 rounded-control bg-muted" />
                        )}
                        <span className="min-w-0 flex-1">
                          {i.productSlug ? (
                            <Link
                              href={`/gift/products/${i.productSlug}`}
                              className="hover:text-primary"
                            >
                              {i.productTitle}
                            </Link>
                          ) : (
                            i.productTitle
                          )}{' '}
                          ({i.label}) × {i.quantity}
                        </span>
                        <span className="flex shrink-0 items-center gap-gs-3">
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
                  <h3 className="mb-gs-3 font-medium text-body">Recommended</h3>
                  {suggestions.length === 0 ? (
                    <p className="text-body opacity-70">
                      {box.items.length === 0 ? 'No matches' : 'Nothing else fits'} —{' '}
                      <Link href="/gift/products" className="underline">
                        browse all
                      </Link>
                      .
                    </p>
                  ) : (
                    <ul className="grid gap-gs-3 sm:grid-cols-2">
                      {suggestions.map((s) => (
                        <li key={s.variantId} className="clay-card overflow-hidden text-body">
                          {s.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={s.imageUrl}
                              alt=""
                              className="aspect-[4/5] w-full object-cover"
                            />
                          ) : null}
                          <div className="p-gs-3">
                            <Link
                              href={`/gift/products/${s.productSlug}`}
                              className="font-medium hover:text-primary"
                            >
                              {s.productTitle}
                            </Link>
                            <p className="opacity-70">
                              {s.label} · {formatInr(s.pricePaise)}
                            </p>
                            <AddToBoxButton
                              disabled={busy || over}
                              onClick={() => void addSuggestion(s.variantId)}
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-gs-3">
                  <CartMoveButton
                    className="hidden lg:inline-flex"
                    busy={busy}
                    disabled={busy || box.items.length === 0 || over}
                    onClick={() => void moveToCart()}
                    idleLabel="Add box to cart"
                  />
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
          </div>

          <aside className="clay-panel byb-summary hidden lg:block">
            <BoxSummaryMark />
            <p className="mt-gs-3 text-center font-medium text-body">Your box</p>
            <dl className="mt-gs-3 space-y-gs-2 text-caption opacity-80">
              <div className="flex justify-between gap-gs-2">
                <dt>Who</dt>
                <dd>{who ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-gs-2">
                <dt>Age</dt>
                <dd>{age ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-gs-2">
                <dt>Occasion</dt>
                <dd>{occasion ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-gs-2">
                <dt>Budget</dt>
                <dd>{box.budgetPaise != null ? formatInr(box.budgetPaise) : '—'}</dd>
              </div>
              <div className="flex justify-between gap-gs-2">
                <dt>Items</dt>
                <dd>{box.items.length}</dd>
              </div>
            </dl>
            {box.budgetPaise != null ? (
              <div className="mt-gs-4">
                <div
                  className="byb-meter"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(Math.min(100, usedRatio * 100))}
                  aria-label="Budget used"
                >
                  <div
                    className={`byb-meter__fill ${meterClass}`}
                    style={{ width: `${Math.min(100, usedRatio * 100)}%` }}
                  />
                </div>
                <p className="mt-gs-2 text-body font-semibold">
                  Remaining {formatInr(Math.max(0, box.remainingBudgetPaise ?? 0))}
                </p>
                <p className="text-caption opacity-70">Subtotal {formatInr(box.subtotalPaise)}</p>
                {over ? (
                  <p className="mt-gs-1 text-caption text-danger">
                    Over by {formatInr(box.overBudgetPaise ?? 0)}
                  </p>
                ) : null}
              </div>
            ) : null}
          </aside>
        </div>
      )}

      {!resumeChoice && step === 6 ? (
        <div className="byb-dock lg:hidden">
          <p className="byb-dock__remain">
            {box.remainingBudgetPaise != null ? (
              <>
                <span className="byb-dock__label">Remaining</span>
                <span className="byb-dock__amount">
                  {formatInr(Math.max(0, box.remainingBudgetPaise))}
                </span>
              </>
            ) : (
              <>
                <span className="byb-dock__label">Subtotal</span>
                <span className="byb-dock__amount">{formatInr(box.subtotalPaise)}</span>
              </>
            )}
          </p>
          <CartMoveButton
            className="byb-dock__cta"
            busy={busy}
            disabled={busy || box.items.length === 0 || over}
            onClick={() => void moveToCart()}
            idleLabel="Add to cart"
          />
        </div>
      ) : null}
    </main>
  );
}

function ChoiceTile({
  pressed,
  label,
  hint,
  icon: Icon,
  tone,
  compact,
  onClick,
}: {
  pressed: boolean;
  label: string;
  hint?: string;
  icon?: AnimIcon;
  tone?: 'blush' | 'mint' | 'lavender' | 'yellow';
  compact?: boolean;
  onClick: () => void;
}) {
  const motion = useOnceIcon<AnimHandle>();
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={`byb-choice${tone ? ` byb-choice--${tone}` : ''}${compact ? ' byb-choice--compact' : ''}`}
      onMouseEnter={motion.play}
      onClick={() => {
        motion.play();
        onClick();
      }}
    >
      {Icon ? (
        <span className="byb-choice__icon">
          <Icon ref={motion.ref} size={16} animateOnHover={false} aria-hidden />
        </span>
      ) : null}
      <span className="text-body font-medium">{label}</span>
      {hint ? <span className="text-caption opacity-60">{hint}</span> : null}
    </button>
  );
}

function CartMoveButton({
  busy,
  disabled,
  onClick,
  idleLabel,
  className = '',
}: {
  busy: boolean;
  disabled: boolean;
  onClick: () => void;
  idleLabel: string;
  className?: string;
}) {
  const cart = useOnceIcon<CartIconHandle>();
  return (
    <button
      type="button"
      disabled={disabled}
      onMouseEnter={cart.play}
      onClick={() => {
        cart.play();
        onClick();
      }}
      className={`clay-btn gift-icon-motion inline-flex shrink-0 items-center justify-center gap-gs-2 whitespace-nowrap disabled:opacity-50 ${className}`.trim()}
    >
      <CartIcon ref={cart.ref} size={18} animateOnHover={false} aria-hidden className="shrink-0" />
      <span>{busy ? 'Moving…' : idleLabel}</span>
    </button>
  );
}

function AddToBoxButton({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  const box = useOnceIcon<BoxIconHandle>();
  return (
    <button
      type="button"
      disabled={disabled}
      onMouseEnter={box.play}
      onClick={() => {
        box.play();
        onClick();
      }}
      className="clay-btn-secondary gift-icon-motion mt-gs-2 !min-h-0 gap-gs-1 !px-gs-3 !py-1 text-caption disabled:opacity-50"
    >
      <BoxIcon ref={box.ref} size={14} animateOnHover={false} aria-hidden className="shrink-0" />
      Add to box
    </button>
  );
}

function BoxSummaryMark() {
  const box = useOnceIcon<BoxIconHandle>();
  return (
    <div className="mx-auto grid size-16 place-items-center text-primary" onMouseEnter={box.play}>
      <BoxIcon ref={box.ref} size={36} animateOnHover={false} aria-hidden />
    </div>
  );
}
