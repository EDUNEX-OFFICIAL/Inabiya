'use client';

import Link from 'next/link';
import {
  Suspense,
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  CircleAlert,
  FileUp,
  Loader2,
  Package,
  RotateCcw,
  ShoppingBag,
  Upload,
} from 'lucide-react';
import { apiAuth, getStoredAccessToken, getStoredUser, loginUrl } from '@/lib/auth-client';
import { parseInventoryCsv } from '@/lib/parse-inventory-csv';
import { parseProductCsv } from '@/lib/parse-product-csv';
import { opsChipClass } from '@/lib/ops-desk-ui';
import { canMutateCommerceFinance } from '@/lib/commerce-ops-nav';
import { OpsPageHeader } from '@/components/commerce-ops/ops-page-header';
import { OpsTableScroll } from '@/components/commerce-ops/ops-table-scroll';

type ImportKind = 'stock' | 'products';

type ImportResultRow = {
  row: number;
  sku: string;
  slug?: string;
  ok: boolean;
  error?: string;
  availableAfter?: number;
  productId?: string;
};

type ImportResult = {
  dryRun: boolean;
  total: number;
  okCount: number;
  errorCount: number;
  results: ImportResultRow[];
};

const STOCK_SAMPLE = `sku,delta,reason,note
DEMO-SKU,10,RECEIVE,restock demo
`;

const PRODUCT_SAMPLE = `slug,title,sku,pricePaise,onHand,description,compareAtPaise,status,imageUrl,label
sample-rose-set,Sample Rose Set,SAMPLE-ROSE-1,49900,5,Soft gift demo,59900,DRAFT,,Default
`;

const REASON_CHIPS = ['RECEIVE', 'DAMAGE', 'RECOUNT', 'CORRECTION'] as const;
const RESULT_PAGE = 80;

function parseKind(raw: string | null): ImportKind {
  return raw === 'products' ? 'products' : 'stock';
}

function ImportDeskInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const kindRaw = parseKind(searchParams.get('kind'));
  const canFinance = canMutateCommerceFinance(getStoredUser()?.roles ?? []);
  const kind: ImportKind = kindRaw === 'products' && !canFinance ? 'stock' : kindRaw;
  const editorId = useId();
  const fileInputId = useId();
  const abortRef = useRef<AbortController | null>(null);

  const [text, setText] = useState(kind === 'products' ? PRODUCT_SAMPLE : STOCK_SAMPLE);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resultLimit, setResultLimit] = useState(RESULT_PAGE);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setText(kind === 'products' ? PRODUCT_SAMPLE : STOCK_SAMPLE);
    setResult(null);
    setError(null);
    setResultLimit(RESULT_PAGE);
  }, [kind]);

  const deferredText = useDeferredValue(text);
  const parsePreview = useMemo(
    () => (kind === 'products' ? parseProductCsv(deferredText) : parseInventoryCsv(deferredText)),
    [deferredText, kind],
  );
  const parsingLag = text !== deferredText;

  const commitBlocked = Boolean(result?.dryRun && result.errorCount > 0);
  const canSubmit = !busy && text.trim().length > 0;

  function setKind(next: ImportKind) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'stock') params.delete('kind');
    else params.set('kind', next);
    const qs = params.toString();
    router.replace(qs ? `/admin/commerce/import?${qs}` : '/admin/commerce/import');
  }

  async function run(dryRun: boolean) {
    if (!getStoredAccessToken()) {
      router.replace(
        loginUrl(`/admin/commerce/import${kind === 'products' ? '?kind=products' : ''}`),
      );
      return;
    }

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setBusy(true);
    setError(null);
    setResultLimit(RESULT_PAGE);

    if (kind === 'products') {
      if (!canFinance) {
        setError('Finance role required');
        setBusy(false);
        return;
      }
      const parsed = parseProductCsv(text);
      if (!parsed.rows.length) {
        setError('No valid rows to import');
        setResult(null);
        setBusy(false);
        return;
      }
      try {
        const res = await apiAuth<ImportResult>('/admin/catalog/products/import', {
          method: 'POST',
          json: { dryRun, rows: parsed.rows },
          signal: ac.signal,
        });
        if (ac.signal.aborted) return;
        startTransition(() => setResult(res));
      } catch (e) {
        if (ac.signal.aborted || (e instanceof DOMException && e.name === 'AbortError')) return;
        setError(e instanceof Error ? e.message : 'Import failed');
        setResult(null);
      } finally {
        if (!ac.signal.aborted) setBusy(false);
      }
      return;
    }

    const parsed = parseInventoryCsv(text);
    if (!parsed.rows.length) {
      setError('No valid rows to import');
      setResult(null);
      setBusy(false);
      return;
    }

    try {
      const res = await apiAuth<ImportResult>('/admin/commerce/inventory/import', {
        method: 'POST',
        json: { dryRun, rows: parsed.rows },
        signal: ac.signal,
      });
      if (ac.signal.aborted) return;
      startTransition(() => setResult(res));
    } catch (e) {
      if (ac.signal.aborted || (e instanceof DOMException && e.name === 'AbortError')) return;
      setError(e instanceof Error ? e.message : 'Import failed');
      setResult(null);
    } finally {
      if (!ac.signal.aborted) setBusy(false);
    }
  }

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 512 * 1024) {
      setError('CSV must be under 512 KB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const next = typeof reader.result === 'string' ? reader.result : '';
      setText(next);
      setResult(null);
      setError(null);
      setResultLimit(RESULT_PAGE);
    };
    reader.onerror = () => setError('Could not read file');
    reader.readAsText(file);
  }

  function resetSample() {
    setText(kind === 'products' ? PRODUCT_SAMPLE : STOCK_SAMPLE);
    setResult(null);
    setError(null);
    setResultLimit(RESULT_PAGE);
  }

  const orderedResults = useMemo(() => {
    if (!result) return [];
    const errors = result.results.filter((r) => !r.ok);
    const oks = result.results.filter((r) => r.ok);
    return [...errors, ...oks];
  }, [result]);

  const visibleResults = orderedResults.slice(0, resultLimit);
  const hiddenCount = Math.max(0, orderedResults.length - resultLimit);
  const doneHref = kind === 'products' ? '/admin/commerce/products' : '/admin/commerce/inventory';
  const doneLabel = kind === 'products' ? 'View products' : 'View inventory';

  return (
    <div className="mx-auto w-full max-w-3xl pb-[max(6.5rem,calc(env(safe-area-inset-bottom)+5.5rem))] sm:pb-6">
      <OpsPageHeader
        title={kind === 'products' ? 'Product CSV import' : 'Stock CSV import'}
        actions={
          <>
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href={
                  kind === 'products' ? '/admin/commerce/products' : '/admin/commerce/inventory'
                }
                className="clay-btn-ghost min-h-10 text-sm"
              >
                {kind === 'products' ? (
                  <ShoppingBag className="h-3.5 w-3.5 opacity-70" aria-hidden />
                ) : (
                  <Package className="h-3.5 w-3.5 opacity-70" aria-hidden />
                )}
                {kind === 'products' ? 'Products' : 'Inventory'}
              </Link>
            </div>
            <label
              htmlFor={fileInputId}
              className="clay-btn-secondary inline-flex min-h-10 cursor-pointer items-center gap-1.5 text-sm"
            >
              <FileUp className="h-3.5 w-3.5 opacity-70" aria-hidden />
              Upload CSV
            </label>
            <input
              id={fileInputId}
              type="file"
              accept=".csv,text/csv,text/plain"
              className="sr-only"
              onChange={onFile}
            />
          </>
        }
      />

      <div
        className="mb-3 flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Import type"
      >
        <button
          type="button"
          role="tab"
          aria-selected={kind === 'stock'}
          className={opsChipClass(kind === 'stock')}
          onClick={() => setKind('stock')}
        >
          Stock
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={kind === 'products'}
          className={opsChipClass(kind === 'products')}
          onClick={() => setKind('products')}
          disabled={!canFinance}
        >
          Products
        </button>
      </div>

      <section className="clay-panel space-y-3 p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor={editorId} className="text-sm font-medium">
            CSV
          </label>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted-foreground)]">
            <span className={`tabular-nums ${parsingLag ? 'opacity-50' : ''}`}>
              {parsePreview.rows.length} valid
              {parsePreview.parseErrors.length
                ? ` · ${parsePreview.parseErrors.length} parse errors`
                : ''}
            </span>
            <button
              type="button"
              className="inline-flex min-h-8 items-center gap-1 rounded-md px-2 font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
              onClick={resetSample}
            >
              <RotateCcw className="h-3 w-3 opacity-60" aria-hidden />
              Reset
            </button>
          </div>
        </div>

        {kind === 'stock' ? (
          <div
            className="-mx-0.5 flex gap-1.5 overflow-x-auto px-0.5 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="list"
            aria-label="Allowed reasons"
          >
            {REASON_CHIPS.map((r) => (
              <span
                key={r}
                role="listitem"
                className="clay-chip shrink-0 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide sm:text-xs"
              >
                {r}
              </span>
            ))}
          </div>
        ) : (
          <div
            className="-mx-0.5 flex gap-1.5 overflow-x-auto px-0.5 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="list"
            aria-label="Status values"
          >
            {(['DRAFT', 'PUBLISHED'] as const).map((s) => (
              <span
                key={s}
                role="listitem"
                className="clay-chip shrink-0 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide sm:text-xs"
              >
                {s}
              </span>
            ))}
          </div>
        )}

        <textarea
          id={editorId}
          className="clay-input min-h-[11rem] w-full resize-y font-mono text-xs leading-relaxed sm:min-h-[14rem] sm:text-[13px]"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (result) setResult(null);
            if (error) setError(null);
          }}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          placeholder={
            kind === 'products' ? 'slug,title,sku,pricePaise,onHand,...' : 'sku,delta,reason,note'
          }
        />

        {parsePreview.parseErrors.length > 0 ? (
          <ul className="max-h-28 space-y-1 overflow-y-auto text-xs text-amber-900 sm:text-sm">
            {parsePreview.parseErrors.slice(0, 12).map((e) => (
              <li key={`${e.row}-${e.message}`} className="flex gap-1.5">
                <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                <span>
                  Row {e.row}: {e.message}
                </span>
              </li>
            ))}
            {parsePreview.parseErrors.length > 12 ? (
              <li className="opacity-70">+{parsePreview.parseErrors.length - 12} more</li>
            ) : null}
          </ul>
        ) : null}

        <div className="hidden flex-wrap gap-2 sm:flex">
          <button
            type="button"
            className="clay-btn-secondary inline-flex min-h-10 items-center gap-1.5 text-sm disabled:opacity-50"
            disabled={!canSubmit}
            onClick={() => void run(true)}
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : null}
            Dry-run
          </button>
          <button
            type="button"
            className="clay-btn inline-flex min-h-10 items-center gap-1.5 text-sm disabled:opacity-50"
            disabled={!canSubmit || commitBlocked}
            onClick={() => void run(false)}
          >
            <Upload className="h-3.5 w-3.5 opacity-80" aria-hidden />
            Commit import
          </button>
        </div>
      </section>

      {error ? (
        <div className="gift-banner gift-banner--danger mt-3" role="alert">
          {error}
        </div>
      ) : null}

      {result ? (
        <section className="clay-panel mt-3 overflow-hidden" aria-live="polite">
          <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] px-3 py-2.5 sm:px-4">
            {result.errorCount === 0 ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden />
            ) : (
              <CircleAlert className="h-4 w-4 shrink-0 text-amber-800" aria-hidden />
            )}
            <p className="min-w-0 flex-1 text-sm font-medium">
              {result.dryRun ? 'Dry-run' : 'Committed'}{' '}
              <span className="font-normal text-[var(--muted-foreground)]">
                · {result.okCount}/{result.total} ok
                {result.errorCount ? ` · ${result.errorCount} errors` : ''}
              </span>
            </p>
            {!result.dryRun && result.errorCount === 0 ? (
              <Link
                href={doneHref}
                className="text-xs font-medium underline-offset-2 hover:underline sm:text-sm"
              >
                {doneLabel}
              </Link>
            ) : null}
          </div>

          <ul className="divide-y divide-[var(--border)] sm:hidden">
            {visibleResults.map((r) => (
              <li key={`${r.row}-${r.sku}-${r.slug ?? ''}`} className="px-3 py-2.5 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-medium">{r.slug ?? r.sku}</p>
                    <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                      Row {r.row}
                      {r.slug ? ` · ${r.sku}` : ''}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${
                      r.ok
                        ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80'
                        : 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/80'
                    }`}
                  >
                    {r.ok ? 'ok' : 'error'}
                  </span>
                </div>
                <p className="mt-1 break-words text-xs text-[var(--muted-foreground)]">
                  {r.error ??
                    (r.availableAfter != null
                      ? `available → ${r.availableAfter}`
                      : r.productId
                        ? 'created'
                        : '—')}
                </p>
              </li>
            ))}
          </ul>

          <div className="hidden sm:block">
            <OpsTableScroll>
              <table className="w-full min-w-[28rem] border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-[var(--muted-foreground)]">
                    <th className="px-4 py-2 font-medium">Row</th>
                    <th className="py-2 pr-2 font-medium">
                      {kind === 'products' ? 'Slug' : 'SKU'}
                    </th>
                    <th className="py-2 pr-2 font-medium">Status</th>
                    <th className="py-2 pr-4 font-medium">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleResults.map((r) => (
                    <tr
                      key={`${r.row}-${r.sku}-${r.slug ?? ''}`}
                      className="border-b border-[var(--border)] last:border-0"
                    >
                      <td className="px-4 py-2 tabular-nums">{r.row}</td>
                      <td className="py-2 pr-2 font-mono">{r.slug ?? r.sku}</td>
                      <td className="py-2 pr-2">
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${
                            r.ok
                              ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80'
                              : 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/80'
                          }`}
                        >
                          {r.ok ? 'ok' : 'error'}
                        </span>
                      </td>
                      <td className="max-w-[18rem] truncate py-2 pr-4 text-[var(--muted-foreground)]">
                        {r.error ??
                          (r.availableAfter != null
                            ? `available → ${r.availableAfter}`
                            : r.productId
                              ? 'created'
                              : '—')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </OpsTableScroll>
          </div>

          {hiddenCount > 0 ? (
            <div className="border-t border-[var(--border)] px-3 py-2 sm:px-4">
              <button
                type="button"
                className="text-sm font-medium underline-offset-2 hover:underline"
                onClick={() => setResultLimit((n) => n + RESULT_PAGE)}
              >
                Show {Math.min(RESULT_PAGE, hiddenCount)} more · {hiddenCount} hidden
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_92%,white)] px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:hidden">
        <div className="mx-auto flex max-w-3xl gap-2">
          <button
            type="button"
            className="clay-btn-secondary inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 text-sm disabled:opacity-50"
            disabled={!canSubmit}
            onClick={() => void run(true)}
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : null}
            Dry-run
          </button>
          <button
            type="button"
            className="clay-btn inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 text-sm disabled:opacity-50"
            disabled={!canSubmit || commitBlocked}
            onClick={() => void run(false)}
          >
            Commit
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ImportPage() {
  return (
    <Suspense
      fallback={
        <div className="clay-panel space-y-3 p-4" aria-busy="true" aria-label="Loading import">
          <div className="h-7 w-48 animate-pulse rounded bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
          <div className="h-40 animate-pulse rounded-lg bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)]" />
        </div>
      }
    >
      <ImportDeskInner />
    </Suspense>
  );
}
