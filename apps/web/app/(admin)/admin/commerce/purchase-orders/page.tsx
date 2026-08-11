'use client';

import Link from 'next/link';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, RefreshCw, ClipboardList } from 'lucide-react';
import { apiAuth, getStoredAccessToken, loginUrl } from '@/lib/auth-client';
import { formatInr } from '@/lib/catalog';
import { opsChipClass } from '@/lib/ops-desk-ui';
import { OpsPageHeader } from '@/components/commerce-ops/ops-page-header';
import { OpsTableScroll } from '@/components/commerce-ops/ops-table-scroll';

type PoStatus = 'DRAFT' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';

type PoRow = {
  id: string;
  poNumber: string;
  status: PoStatus;
  createdAt: string;
  supplier: { id: string; code: string; name: string; city: string | null };
  lineCount: number;
  totalCostPaise: number;
};

const STATUS_CHIPS: Array<{ value: '' | PoStatus; label: string }> = [
  { value: '', label: 'All' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ORDERED', label: 'Ordered' },
  { value: 'RECEIVED', label: 'Received' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

function statusTone(status: PoStatus): string {
  if (status === 'RECEIVED') return 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80';
  if (status === 'ORDERED') return 'bg-sky-50 text-sky-900 ring-1 ring-sky-200/80';
  if (status === 'CANCELLED') return 'bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200/80';
  return 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/80';
}

function PurchaseOrdersInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = (searchParams.get('status') as PoStatus | null) ?? '';
  const [rows, setRows] = useState<PoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const qs = status ? `?status=${status}` : '';
      const data = await apiAuth<PoRow[]>(`/admin/commerce/purchase-orders${qs}`);
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace(loginUrl('/admin/commerce/purchase-orders'));
      return;
    }
    void load();
  }, [load, router]);

  function setStatusFilter(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!next) params.delete('status');
    else params.set('status', next);
    const s = params.toString();
    router.replace(s ? `/admin/commerce/purchase-orders?${s}` : '/admin/commerce/purchase-orders');
  }

  return (
    <div>
      <OpsPageHeader
        title="Purchase orders"
        actions={
          <>
            <Link href="/admin/commerce/suppliers" className="clay-btn-ghost min-h-10 text-sm">
              Suppliers
            </Link>
            <Link
              href="/admin/commerce/purchase-orders/new"
              className="clay-btn inline-flex min-h-10 items-center gap-1.5 text-sm"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              New PO
            </Link>
            <button
              type="button"
              className="clay-btn-secondary inline-flex min-h-10 items-center gap-1.5 text-sm"
              disabled={loading}
              onClick={() => void load()}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden />
              Refresh
            </button>
          </>
        }
      />

      <div
        className="mb-3 flex gap-1.5 overflow-x-auto pb-0.5"
        role="group"
        aria-label="Filter by status"
      >
        {STATUS_CHIPS.map((c) => (
          <button
            key={c.value || 'all'}
            type="button"
            aria-pressed={status === c.value}
            className={opsChipClass(status === c.value)}
            onClick={() => setStatusFilter(c.value)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="clay-panel space-y-3 p-4" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-10 animate-pulse rounded-lg bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]"
            />
          ))}
        </div>
      ) : null}

      {!loading && rows.length === 0 ? (
        <div className="clay-panel flex flex-col items-center gap-3 px-6 py-12 text-center">
          <ClipboardList className="h-8 w-8 opacity-30" aria-hidden />
          <p className="text-sm opacity-70">No purchase orders.</p>
          <Link href="/admin/commerce/purchase-orders/new" className="clay-btn text-sm">
            New PO
          </Link>
        </div>
      ) : null}

      {!loading && rows.length > 0 ? (
        <OpsTableScroll>
          <div className="clay-panel overflow-hidden">
            <table className="w-full min-w-[40rem] border-collapse text-sm">
              <thead>
                <tr className="ops-th border-b border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--foreground)_3.5%,transparent)] text-left">
                  <th className="px-3 py-2.5 font-medium">PO</th>
                  <th className="px-2 py-2.5 font-medium">Supplier</th>
                  <th className="px-2 py-2.5 font-medium">Lines</th>
                  <th className="px-2 py-2.5 font-medium">Cost</th>
                  <th className="px-2 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((po) => (
                  <tr key={po.id} className="border-b border-[var(--border-subtle)]">
                    <td className="px-3 py-2.5">
                      <Link
                        href={`/admin/commerce/purchase-orders/${po.id}`}
                        className="font-mono text-xs font-medium underline-offset-2 hover:underline"
                      >
                        {po.poNumber}
                      </Link>
                    </td>
                    <td className="px-2 py-2.5">
                      <p className="font-medium">{po.supplier.name}</p>
                      <p className="text-[11px] text-[var(--muted-foreground)]">
                        {po.supplier.code}
                        {po.supplier.city ? ` · ${po.supplier.city}` : ''}
                      </p>
                    </td>
                    <td className="px-2 py-2.5 tabular-nums">{po.lineCount}</td>
                    <td className="px-2 py-2.5 tabular-nums">{formatInr(po.totalCostPaise)}</td>
                    <td className="px-2 py-2.5">
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${statusTone(po.status)}`}
                      >
                        {po.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </OpsTableScroll>
      ) : null}
    </div>
  );
}

export default function PurchaseOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="clay-panel p-4" aria-busy="true">
          Loading…
        </div>
      }
    >
      <PurchaseOrdersInner />
    </Suspense>
  );
}
