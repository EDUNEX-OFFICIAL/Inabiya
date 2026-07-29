'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import {
  COLLECTION_AGES,
  COLLECTION_BUDGETS,
  COLLECTION_CATEGORIES,
  COLLECTION_OCCASIONS,
  COLLECTION_RECIPIENTS,
  collectionHref,
  countActiveRefines,
  refineParamsForUrl,
  type CollectionRefine,
  type GiftCollection,
} from '@/lib/gift-collections';

type Props = {
  collection: GiftCollection;
  refine: CollectionRefine;
};

function toggleValue(current: string | undefined, next: string): string | undefined {
  return current === next ? undefined : next;
}

function FacetOption({
  label,
  active,
  onToggle,
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={
        active
          ? 'flex w-full items-center gap-gs-2 rounded-lg bg-primary/12 px-gs-2 py-gs-2 text-left text-sm font-medium text-primary'
          : 'flex w-full items-center gap-gs-2 rounded-lg px-gs-2 py-gs-2 text-left text-sm text-foreground/80 hover:bg-foreground/[0.04]'
      }
      aria-pressed={active}
    >
      <span
        className={
          active
            ? 'flex size-4 shrink-0 items-center justify-center rounded border border-primary bg-primary text-[10px] text-primary-foreground'
            : 'size-4 shrink-0 rounded border border-foreground/25 bg-transparent'
        }
        aria-hidden
      >
        {active ? '✓' : null}
      </span>
      {label}
    </button>
  );
}

function AccordionGroup({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details className="group border-b border-foreground/8 pb-gs-3" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between py-gs-2 text-xs font-semibold uppercase tracking-wide text-foreground/50 [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="size-4 opacity-50 transition group-open:rotate-180" aria-hidden />
      </summary>
      <div className="mt-gs-1 flex flex-col gap-0.5">{children}</div>
    </details>
  );
}

function FacetEditor({
  collection,
  value,
  onChange,
}: {
  collection: GiftCollection;
  value: CollectionRefine;
  onChange: (next: CollectionRefine) => void;
}) {
  const hide = new Set(collection.hideFacets);
  const set = (patch: Partial<CollectionRefine>) => onChange({ ...value, ...patch });

  return (
    <div className="flex flex-col gap-gs-1">
      <div className="mb-gs-3 rounded-xl bg-foreground/[0.03] px-gs-3 py-gs-3">
        <p className="text-xs font-medium uppercase tracking-wide text-foreground/45">Browsing</p>
        <p className="mt-1 text-sm font-medium text-foreground">{collection.lockedLabel}</p>
      </div>

      {!hide.has('category') ? (
        <AccordionGroup title="Category" defaultOpen>
          {COLLECTION_CATEGORIES.map((c) => (
            <FacetOption
              key={c.value}
              label={c.label}
              active={value.category === c.value}
              onToggle={() => set({ category: toggleValue(value.category, c.value) })}
            />
          ))}
        </AccordionGroup>
      ) : null}

      {!hide.has('age') ? (
        <AccordionGroup title="Age band" defaultOpen>
          {COLLECTION_AGES.map((a) => (
            <FacetOption
              key={a.value}
              label={a.label}
              active={value.age === a.value}
              onToggle={() => set({ age: toggleValue(value.age, a.value) })}
            />
          ))}
        </AccordionGroup>
      ) : null}

      {!hide.has('budget') ? (
        <AccordionGroup title="Budget" defaultOpen>
          {COLLECTION_BUDGETS.map((b) => (
            <FacetOption
              key={b.value}
              label={b.label}
              active={value.maxPricePaise === b.value}
              onToggle={() => set({ maxPricePaise: toggleValue(value.maxPricePaise, b.value) })}
            />
          ))}
        </AccordionGroup>
      ) : null}

      {!hide.has('occasion') ? (
        <AccordionGroup title="Occasion">
          {COLLECTION_OCCASIONS.map((o) => (
            <FacetOption
              key={o.value}
              label={o.label}
              active={value.occasion === o.value}
              onToggle={() => set({ occasion: toggleValue(value.occasion, o.value) })}
            />
          ))}
        </AccordionGroup>
      ) : null}

      {!hide.has('recipient') ? (
        <AccordionGroup title="Recipient">
          {COLLECTION_RECIPIENTS.map((r) => (
            <FacetOption
              key={r.value}
              label={r.label}
              active={value.recipient === r.value}
              onToggle={() => set({ recipient: toggleValue(value.recipient, r.value) })}
            />
          ))}
        </AccordionGroup>
      ) : null}

      {!hide.has('hamper') ? (
        <AccordionGroup title="Type">
          <FacetOption
            label="Ready hampers"
            active={value.hamper === '1'}
            onToggle={() => set({ hamper: toggleValue(value.hamper, '1') })}
          />
        </AccordionGroup>
      ) : null}

      {!hide.has('onSale') ? (
        <AccordionGroup title="Offers">
          <FacetOption
            label="On sale"
            active={value.onSale === '1'}
            onToggle={() => set({ onSale: toggleValue(value.onSale, '1') })}
          />
        </AccordionGroup>
      ) : null}
    </div>
  );
}

/** Desktop sidebar — apply immediately via navigation. */
function DesktopSidebar({ collection, refine }: Props) {
  const router = useRouter();
  const activeCount = countActiveRefines(collection, refine);

  const apply = (next: CollectionRefine) => {
    router.push(collectionHref(collection.slug, refineParamsForUrl(collection, next)));
  };

  return (
    <aside className="hidden w-56 shrink-0 md:block lg:w-64" aria-label="Collection filters">
      <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pb-gs-6 pr-gs-1">
        <p className="gift-overline mb-gs-3">Filters</p>
        <FacetEditor
          collection={collection}
          value={refine}
          onChange={(next) => apply({ ...next, sort: refine.sort })}
        />
        {activeCount > 0 ? (
          <div className="sticky bottom-0 mt-gs-4 border-t border-foreground/8 bg-[var(--background)] pt-gs-3">
            <Link
              href={collectionHref(collection.slug, refineParamsForUrl(collection, { sort: refine.sort }))}
              className="gift-link text-sm"
            >
              Clear filters
            </Link>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

/** Mobile sticky bar + Apply sheet with focus trap. */
function MobileFilters({ collection, refine }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<CollectionRefine>(refine);
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const openBtnRef = useRef<HTMLButtonElement>(null);
  const activeCount = countActiveRefines(collection, refine);

  useEffect(() => {
    if (!open) setDraft(refine);
  }, [refine, open]);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const focusables = () =>
      panel?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ) ?? [];

    const list = focusables();
    list[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const nodes = [...focusables()];
      if (nodes.length === 0) return;
      const first = nodes[0]!;
      const last = nodes[nodes.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const close = useCallback(() => {
    setOpen(false);
    queueMicrotask(() => openBtnRef.current?.focus());
  }, []);

  const applyDraft = () => {
    router.push(
      collectionHref(collection.slug, refineParamsForUrl(collection, { ...draft, sort: refine.sort })),
    );
    close();
  };

  const clearDraft = () => {
    setDraft({ sort: refine.sort });
  };

  return (
    <>
      <div className="sticky top-[4.5rem] z-20 -mx-gs-1 mb-gs-4 flex items-center gap-gs-3 border-b border-foreground/8 bg-[var(--background)]/95 px-gs-1 py-gs-3 backdrop-blur-md md:hidden">
        <button
          ref={openBtnRef}
          type="button"
          className="clay-btn-secondary inline-flex items-center gap-gs-2 !min-h-0 !px-gs-3 !py-gs-2 text-sm"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-haspopup="dialog"
        >
          <SlidersHorizontal className="size-4" aria-hidden />
          Filters
          {activeCount > 0 ? (
            <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
              {activeCount}
            </span>
          ) : null}
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 md:hidden" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/40"
            aria-label="Close filters"
            onClick={close}
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-2xl bg-[var(--background)] shadow-clay"
            onKeyDown={(e: ReactKeyboardEvent) => {
              if (e.key === 'Escape') close();
            }}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-foreground/8 px-gs-5 py-gs-4">
              <h2 id={titleId} className="font-display text-lg tracking-tight">
                Filters
              </h2>
              <button
                type="button"
                className="clay-btn-ghost !min-h-0 !p-gs-2"
                aria-label="Close"
                onClick={close}
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-gs-5 py-gs-4">
              <FacetEditor collection={collection} value={draft} onChange={setDraft} />
            </div>
            <div className="flex shrink-0 gap-gs-3 border-t border-foreground/8 px-gs-5 py-gs-4">
              <button type="button" className="clay-btn-secondary flex-1 justify-center" onClick={clearDraft}>
                Clear
              </button>
              <button type="button" className="clay-btn flex-1 justify-center" onClick={applyDraft}>
                Show results
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function CollectionFilters({ collection, refine }: Props) {
  return (
    <>
      <MobileFilters collection={collection} refine={refine} />
      <DesktopSidebar collection={collection} refine={refine} />
    </>
  );
}
