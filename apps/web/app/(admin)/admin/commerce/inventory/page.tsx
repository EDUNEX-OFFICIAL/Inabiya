'use client';

import Link from 'next/link';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';
import { OpsPageHeader } from '@/components/commerce-ops/ops-page-header';
import { OpsTableScroll } from '@/components/commerce-ops/ops-table-scroll';

type InventoryRow = {
  inventoryId: string;
  variantId: string;
  sku: string;
  label: string;
  productId: string;
  productTitle: string;
  productSlug: string;
  productStatus: string;
  onHand: number;
  reserved: number;
  available: number;
  lowStock: boolean;
};

type Movement = {
  id: string;
  deltaOnHand: number;
  reason: string;
  note: string | null;
  onHandAfter: number;
  reservedAfter: number;
  actorEmail: string | null;
  createdAt: string;
};

const REASONS = ['RECEIVE', 'DAMAGE', 'RECOUNT', 'CORRECTION'] as const;

function InventoryDeskInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lowOnly = searchParams.get('lowStock') === '1';
  const qParam = searchParams.get('q') ?? '';

  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [qInput, setQInput] = useState(qParam);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [adjustFor, setAdjustFor] = useState<InventoryRow | null>(null);
  const [delta, setDelta] = useState('1');
  const [reason, setReason] = useState<(typeof REASONS)[number]>('RECEIVE');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const [historyFor, setHistoryFor] = useState<InventoryRow | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (qParam) params.set('q', qParam);
      if (lowOnly) params.set('lowStock', '1');
      const qs = params.toString();
      const data = await apiAuth<InventoryRow[]>(
        `/admin/commerce/inventory${qs ? `?${qs}` : ''}`,
      );
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [qParam, lowOnly]);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace('/login');
      return;
    }
    void load();
  }, [load, router]);

  function patchQuery(patch: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === '') params.delete(k);
      else params.set(k, v);
    }
    const s = params.toString();
    router.replace(s ? `/admin/commerce/inventory?${s}` : '/admin/commerce/inventory');
  }

  async function submitAdjust() {
    if (!adjustFor) return;
    const n = Number(delta);
    if (!Number.isInteger(n) || n === 0) {
      setError('Delta must be a non-zero integer (use negative for remove/damage).');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await apiAuth(`/admin/commerce/inventory/${adjustFor.variantId}/adjust`, {
        method: 'POST',
        json: { delta: n, reason, note: note.trim() || undefined },
      });
      setAdjustFor(null);
      setDelta('1');
      setNote('');
      setReason('RECEIVE');
      await load();
      if (historyFor?.variantId === adjustFor.variantId) {
        setMovements(
          await apiAuth<Movement[]>(`/admin/commerce/inventory/${adjustFor.variantId}/movements`),
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Adjust failed');
    } finally {
      setBusy(false);
    }
  }

  async function openHistory(row: InventoryRow) {
    setHistoryFor(row);
    try {
      setMovements(await apiAuth<Movement[]>(`/admin/commerce/inventory/${row.variantId}/movements`));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'History failed');
    }
  }

  return (
    <div>
      <OpsPageHeader
        title="Inventory"
        description="Stock truth desk — adjust with reason; available never goes negative."
        actions={
          <button
            type="button"
            className="clay-btn-secondary min-h-10 text-sm"
            disabled={loading}
            onClick={() => void load()}
          >
            Refresh
          </button>
        }
      />

      <form
        className="mb-3 flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          patchQuery({ q: qInput.trim() || null });
        }}
      >
        <input
          className="clay-input min-h-10 flex-1 text-sm"
          placeholder="Search SKU, label, product…"
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
        />
        <button type="submit" className="clay-btn min-h-10 text-sm">
          Search
        </button>
      </form>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          className={`min-h-9 rounded-full border px-3 text-xs ${
            !lowOnly
              ? 'border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-[var(--primary)]'
              : 'border-[var(--border-subtle)]'
          }`}
          onClick={() => patchQuery({ lowStock: null })}
        >
          All stock
        </button>
        <button
          type="button"
          className={`min-h-9 rounded-full border px-3 text-xs ${
            lowOnly
              ? 'border-amber-400 bg-amber-50 text-amber-900'
              : 'border-[var(--border-subtle)]'
          }`}
          onClick={() => patchQuery({ lowStock: '1' })}
        >
          Low stock board
        </button>
        <span className="self-center text-xs opacity-50">
          {loading ? 'Loading…' : `${rows.length} SKUs`}
        </span>
      </div>

      {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

      <OpsTableScroll>
        <table className="w-full min-w-[40rem] border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-[11px] uppercase tracking-wide opacity-55">
              <th className="py-2 pr-3">SKU</th>
              <th className="py-2 pr-3">Product</th>
              <th className="py-2 pr-3">On hand</th>
              <th className="py-2 pr-3">Reserved</th>
              <th className="py-2 pr-3">Available</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.variantId} className="border-b align-top">
                <td className="py-2 pr-3 font-mono text-xs">{r.sku}</td>
                <td className="max-w-[12rem] py-2 pr-3">
                  <Link className="underline break-words" href={`/admin/commerce/products/${r.productId}`}>
                    {r.productTitle}
                  </Link>
                  <p className="text-[11px] opacity-55">
                    {r.label} · {r.productStatus}
                  </p>
                </td>
                <td className="py-2 pr-3 tabular-nums">{r.onHand}</td>
                <td className="py-2 pr-3 tabular-nums">{r.reserved}</td>
                <td className="py-2 pr-3">
                  <span className="tabular-nums">{r.available}</span>
                  {r.lowStock ? (
                    <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-amber-900">
                      Low
                    </span>
                  ) : null}
                </td>
                <td className="whitespace-nowrap py-2">
                  <button
                    type="button"
                    className="mr-3 underline"
                    onClick={() => {
                      setAdjustFor(r);
                      setDelta(r.lowStock ? '10' : '1');
                      setReason('RECEIVE');
                      setNote('');
                    }}
                  >
                    Adjust
                  </button>
                  <button type="button" className="underline" onClick={() => void openHistory(r)}>
                    History
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </OpsTableScroll>

      {!loading && rows.length === 0 ? (
        <p className="mt-4 text-sm opacity-60">No inventory rows match.</p>
      ) : null}

      {adjustFor ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Adjust stock"
            className="w-full max-w-md rounded-t-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4 shadow-lg sm:rounded-lg"
          >
            <h2 className="font-display text-lg">Adjust — {adjustFor.sku}</h2>
            <p className="mt-1 text-xs opacity-70">
              {adjustFor.productTitle} · on hand {adjustFor.onHand} · reserved {adjustFor.reserved} ·
              avail {adjustFor.available}
            </p>
            <label className="mt-3 block text-xs">
              Delta (+ receive / − damage)
              <input
                className="clay-input mt-1 w-full"
                type="number"
                step={1}
                value={delta}
                onChange={(e) => setDelta(e.target.value)}
              />
            </label>
            <label className="mt-3 block text-xs">
              Reason
              <select
                className="clay-input mt-1 w-full"
                value={reason}
                onChange={(e) => setReason(e.target.value as (typeof REASONS)[number])}
              >
                {REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-3 block text-xs">
              Note (optional)
              <input
                className="clay-input mt-1 w-full"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
              />
            </label>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="clay-btn min-h-10 text-sm"
                disabled={busy}
                onClick={() => void submitAdjust()}
              >
                {busy ? 'Saving…' : 'Apply'}
              </button>
              <button
                type="button"
                className="clay-btn-ghost min-h-10 text-sm"
                disabled={busy}
                onClick={() => setAdjustFor(null)}
              >
                Cancel
              </button>
            </div>
          </div>
          <button
            type="button"
            className="absolute inset-0 -z-10"
            aria-label="Dismiss"
            onClick={() => !busy && setAdjustFor(null)}
          />
        </div>
      ) : null}

      {historyFor ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Movement history"
            className="flex max-h-[85dvh] w-full max-w-lg flex-col rounded-t-2xl border border-[var(--border-subtle)] bg-[var(--surface)] shadow-lg sm:rounded-lg"
          >
            <div className="border-b border-[var(--border-subtle)] p-4">
              <h2 className="font-display text-lg">History — {historyFor.sku}</h2>
              <p className="text-xs opacity-70">{historyFor.productTitle}</p>
            </div>
            <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4 text-sm">
              {movements.map((m) => (
                <li key={m.id} className="rounded border border-[var(--border-subtle)] p-2">
                  <p className="font-medium">
                    {m.deltaOnHand > 0 ? '+' : ''}
                    {m.deltaOnHand} · {m.reason}
                  </p>
                  {m.note ? <p className="text-xs opacity-80">{m.note}</p> : null}
                  <p className="text-[11px] opacity-55">
                    After: onHand {m.onHandAfter} / reserved {m.reservedAfter} ·{' '}
                    {m.actorEmail ?? 'system'} · {new Date(m.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
              {movements.length === 0 ? (
                <li className="opacity-60">No movements yet.</li>
              ) : null}
            </ul>
            <div className="border-t border-[var(--border-subtle)] p-3">
              <button
                type="button"
                className="clay-btn-secondary min-h-10 w-full text-sm"
                onClick={() => setHistoryFor(null)}
              >
                Close
              </button>
            </div>
          </div>
          <button
            type="button"
            className="absolute inset-0 -z-10"
            aria-label="Dismiss"
            onClick={() => setHistoryFor(null)}
          />
        </div>
      ) : null}
    </div>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<p className="text-sm opacity-70">Loading inventory…</p>}>
      <InventoryDeskInner />
    </Suspense>
  );
}
