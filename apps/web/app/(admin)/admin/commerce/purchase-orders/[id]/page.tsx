'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken, loginUrl } from '@/lib/auth-client';
import { formatInr } from '@/lib/catalog';
import { OpsPageHeader } from '@/components/commerce-ops/ops-page-header';

type PoDetail = {
  id: string;
  poNumber: string;
  status: 'DRAFT' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
  notes: string | null;
  orderedAt: string | null;
  receivedAt: string | null;
  createdAt: string;
  totalCostPaise: number;
  supplier: {
    id: string;
    code: string;
    name: string;
    city: string | null;
    state: string | null;
    contactName: string | null;
    phone: string | null;
  };
  lines: Array<{
    id: string;
    sku: string;
    title: string;
    label: string;
    productId: string;
    quantityOrdered: number;
    quantityReceived: number;
    unitCostPaise: number;
    lineCostPaise: number;
  }>;
};

export default function PurchaseOrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [po, setPo] = useState<PoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await apiAuth<PoDetail>(`/admin/commerce/purchase-orders/${params.id}`);
      setPo(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load PO');
      setPo(null);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace(loginUrl(`/admin/commerce/purchase-orders/${params.id}`));
      return;
    }
    void load();
  }, [load, router, params.id]);

  async function act(path: 'order' | 'receive' | 'cancel', label: string) {
    if (!po) return;
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const next = await apiAuth<PoDetail>(`/admin/commerce/purchase-orders/${po.id}/${path}`, {
        method: 'POST',
        json: {},
      });
      setPo(next);
      setMsg(label);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  }

  if (loading && !po) {
    return (
      <div className="clay-panel space-y-3 p-4" aria-busy="true">
        <div className="h-7 w-40 animate-pulse rounded bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
        <div className="h-24 animate-pulse rounded-lg bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)]" />
      </div>
    );
  }

  if (!po) {
    return (
      <div className="clay-panel px-6 py-12 text-center">
        <p className="text-sm opacity-70">{error ?? 'Not found'}</p>
        <Link href="/admin/commerce/purchase-orders" className="clay-btn mt-3 inline-flex text-sm">
          Purchase orders
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <OpsPageHeader
        title={po.poNumber}
        actions={
          <>
            <Link href="/admin/commerce/purchase-orders" className="clay-btn-ghost min-h-10 text-sm">
              Back
            </Link>
            {po.status === 'DRAFT' ? (
              <button
                type="button"
                className="clay-btn min-h-10 text-sm"
                disabled={busy}
                onClick={() => void act('order', 'Marked ordered')}
              >
                Mark ordered
              </button>
            ) : null}
            {po.status === 'ORDERED' ? (
              <button
                type="button"
                className="clay-btn min-h-10 text-sm"
                disabled={busy}
                onClick={() => void act('receive', 'Received into inventory')}
              >
                Receive all
              </button>
            ) : null}
            {po.status === 'DRAFT' || po.status === 'ORDERED' ? (
              <button
                type="button"
                className="clay-btn-secondary min-h-10 text-sm text-red-700"
                disabled={busy}
                onClick={() => void act('cancel', 'Cancelled')}
              >
                Cancel
              </button>
            ) : null}
          </>
        }
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium">
          {po.status}
        </span>
        <span className="text-xs tabular-nums text-[var(--muted-foreground)]">
          {formatInr(po.totalCostPaise)}
        </span>
      </div>

      {msg ? (
        <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900" role="status">
          {msg}
        </p>
      ) : null}
      {error ? (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      <section className="clay-panel mb-4 p-3 text-sm sm:p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Supplier
        </h2>
        <p className="mt-1 font-medium">{po.supplier.name}</p>
        <p className="text-xs text-[var(--muted-foreground)]">
          {po.supplier.code}
          {po.supplier.city ? ` · ${po.supplier.city}` : ''}
          {po.supplier.state ? `, ${po.supplier.state}` : ''}
        </p>
        {po.notes ? <p className="mt-2 text-[var(--muted-foreground)]">{po.notes}</p> : null}
      </section>

      <section className="clay-panel p-3 text-sm sm:p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Lines
        </h2>
        <ul className="mt-2 divide-y divide-[var(--border-subtle)]">
          {po.lines.map((l) => (
            <li key={l.id} className="flex flex-wrap items-start justify-between gap-2 py-2.5">
              <div className="min-w-0">
                <Link
                  href={`/admin/commerce/products/${l.productId}`}
                  className="font-medium underline-offset-2 hover:underline"
                >
                  {l.title}
                </Link>
                <p className="font-mono text-[11px] text-[var(--muted-foreground)]">{l.sku}</p>
              </div>
              <div className="text-right text-xs tabular-nums text-[var(--muted-foreground)]">
                <p>
                  ×{l.quantityOrdered}
                  {l.quantityReceived ? ` · recv ${l.quantityReceived}` : ''}
                </p>
                <p>{formatInr(l.lineCostPaise)}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
