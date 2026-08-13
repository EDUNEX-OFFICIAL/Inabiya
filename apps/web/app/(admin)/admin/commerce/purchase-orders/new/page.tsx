'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken, loginUrl } from '@/lib/auth-client';
import { formatInr } from '@/lib/catalog';
import { OpsPageHeader } from '@/components/commerce-ops/ops-page-header';

type SupplierOpt = { id: string; code: string; name: string; isActive: boolean };
type ProductHit = {
  id: string;
  title: string;
  variants?: Array<{ id: string; sku: string; label: string; pricePaise: number }>;
};

type LineDraft = {
  variantId: string;
  sku: string;
  title: string;
  quantityOrdered: number;
  unitCostPaise: number;
};

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<SupplierOpt[]>([]);
  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes] = useState('');
  const [productQ, setProductQ] = useState('');
  const [hits, setHits] = useState<ProductHit[]>([]);
  const [lines, setLines] = useState<LineDraft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace(loginUrl('/admin/commerce/purchase-orders/new'));
      return;
    }
    void apiAuth<SupplierOpt[]>('/admin/commerce/suppliers?active=1')
      .then((rows) => {
        setSuppliers(rows.filter((s) => s.isActive));
        if (rows[0]) setSupplierId(rows[0].id);
      })
      .catch(() => setSuppliers([]));
  }, [router]);

  useEffect(() => {
    const q = productQ.trim();
    if (q.length < 2) {
      setHits([]);
      return;
    }
    const t = window.setTimeout(() => {
      void apiAuth<{ items: ProductHit[] }>(
        `/admin/catalog/products?q=${encodeURIComponent(q)}&limit=8`,
      )
        .then((res) => setHits(res.items ?? []))
        .catch(() => setHits([]));
    }, 280);
    return () => window.clearTimeout(t);
  }, [productQ]);

  function addVariant(
    p: ProductHit,
    v: { id: string; sku: string; label: string; pricePaise: number },
  ) {
    if (lines.some((l) => l.variantId === v.id)) return;
    setLines((prev) => [
      ...prev,
      {
        variantId: v.id,
        sku: v.sku,
        title: `${p.title} · ${v.label}`,
        quantityOrdered: 10,
        unitCostPaise: Math.max(0, Math.floor(v.pricePaise * 0.55)),
      },
    ]);
    setProductQ('');
    setHits([]);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!supplierId || !lines.length) {
      setError('Supplier and at least one line required');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const created = await apiAuth<{ id: string }>('/admin/commerce/purchase-orders', {
        method: 'POST',
        json: {
          supplierId,
          notes: notes.trim() || undefined,
          lines: lines.map((l) => ({
            variantId: l.variantId,
            quantityOrdered: l.quantityOrdered,
            unitCostPaise: l.unitCostPaise,
          })),
        },
      });
      router.push(`/admin/commerce/purchase-orders/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
      setBusy(false);
    }
  }

  const total = lines.reduce((s, l) => s + l.unitCostPaise * l.quantityOrdered, 0);

  return (
    <div className="mx-auto max-w-2xl">
      <OpsPageHeader
        title="New purchase order"
        actions={
          <Link href="/admin/commerce/purchase-orders" className="clay-btn-ghost min-h-10 text-sm">
            Back
          </Link>
        }
      />

      {error ? (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      <form className="space-y-4" onSubmit={onSubmit}>
        <section className="clay-panel space-y-3 p-3 sm:p-4">
          <label className="block text-xs">
            <span className="mb-1 block font-medium text-[var(--muted-foreground)]">Supplier</span>
            <select
              className="clay-input min-h-10 w-full text-sm"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              required
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs">
            <span className="mb-1 block font-medium text-[var(--muted-foreground)]">Notes</span>
            <input
              className="clay-input min-h-10 w-full text-sm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
        </section>

        <section className="clay-panel space-y-3 p-3 sm:p-4">
          <label className="block text-xs">
            <span className="mb-1 block font-medium text-[var(--muted-foreground)]">
              Add product
            </span>
            <input
              className="clay-input min-h-10 w-full text-sm"
              value={productQ}
              onChange={(e) => setProductQ(e.target.value)}
              placeholder="Search title or SKU"
            />
          </label>
          {hits.length > 0 ? (
            <ul className="max-h-48 space-y-1 overflow-y-auto text-sm">
              {hits.map((p) =>
                (p.variants ?? []).map((v) => (
                  <li key={v.id}>
                    <button
                      type="button"
                      className="w-full rounded-lg px-2 py-1.5 text-left hover:bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)]"
                      onClick={() => addVariant(p, v)}
                    >
                      <span className="font-medium">{p.title}</span>
                      <span className="ml-2 font-mono text-xs text-[var(--muted-foreground)]">
                        {v.sku}
                      </span>
                    </button>
                  </li>
                )),
              )}
            </ul>
          ) : null}

          {lines.length === 0 ? (
            <p className="text-xs text-[var(--muted-foreground)]">No lines yet.</p>
          ) : (
            <ul className="space-y-2">
              {lines.map((l, idx) => (
                <li
                  key={l.variantId}
                  className="grid gap-2 rounded-lg border border-[var(--border-subtle)] p-2.5 sm:grid-cols-[1fr_5rem_7rem_auto]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{l.title}</p>
                    <p className="font-mono text-[11px] text-[var(--muted-foreground)]">{l.sku}</p>
                  </div>
                  <label className="block text-xs">
                    <span className="mb-0.5 block text-[var(--muted-foreground)]">Qty</span>
                    <input
                      className="clay-input min-h-9 w-full text-sm"
                      type="number"
                      min={1}
                      value={l.quantityOrdered}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        setLines((prev) =>
                          prev.map((x, i) =>
                            i === idx ? { ...x, quantityOrdered: Number.isFinite(n) ? n : 1 } : x,
                          ),
                        );
                      }}
                    />
                  </label>
                  <label className="block text-xs">
                    <span className="mb-0.5 block text-[var(--muted-foreground)]">
                      Cost (paise)
                    </span>
                    <input
                      className="clay-input min-h-9 w-full text-sm"
                      type="number"
                      min={0}
                      value={l.unitCostPaise}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        setLines((prev) =>
                          prev.map((x, i) =>
                            i === idx ? { ...x, unitCostPaise: Number.isFinite(n) ? n : 0 } : x,
                          ),
                        );
                      }}
                    />
                  </label>
                  <div className="flex items-end">
                    <button
                      type="button"
                      className="text-xs font-medium text-red-700 underline-offset-2 hover:underline"
                      onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="text-sm tabular-nums text-[var(--muted-foreground)]">
            Total · <span className="font-medium text-[var(--foreground)]">{formatInr(total)}</span>
          </p>
        </section>

        <button
          type="submit"
          className="clay-btn min-h-10 text-sm"
          disabled={busy || !lines.length}
        >
          Create draft
        </button>
      </form>
    </div>
  );
}
