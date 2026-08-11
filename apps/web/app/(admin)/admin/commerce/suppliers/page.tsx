'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, RefreshCw, Truck } from 'lucide-react';
import { apiAuth, getStoredAccessToken, loginUrl } from '@/lib/auth-client';
import { OpsPageHeader } from '@/components/commerce-ops/ops-page-header';
import { OpsTableScroll } from '@/components/commerce-ops/ops-table-scroll';

type SupplierRow = {
  id: string;
  code: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  gstin: string | null;
  isActive: boolean;
  poCount: number;
};

export default function SuppliersPage() {
  const router = useRouter();
  const [rows, setRows] = useState<SupplierRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('New Delhi');
  const [state, setState] = useState('DL');
  const [gstin, setGstin] = useState('');

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await apiAuth<SupplierRow[]>('/admin/commerce/suppliers');
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace(loginUrl('/admin/commerce/suppliers'));
      return;
    }
    void load();
  }, [load, router]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      await apiAuth('/admin/commerce/suppliers', {
        method: 'POST',
        json: {
          code: code.trim().toUpperCase(),
          name: name.trim(),
          contactName: contactName.trim() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          city: city.trim() || undefined,
          state: state.trim() || undefined,
          gstin: gstin.trim() || undefined,
        },
      });
      setShowForm(false);
      setCode('');
      setName('');
      setContactName('');
      setPhone('');
      setEmail('');
      setGstin('');
      setMsg('Supplier created');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <OpsPageHeader
        title="Suppliers"
        actions={
          <>
            <Link href="/admin/commerce/purchase-orders" className="clay-btn-ghost min-h-10 text-sm">
              Purchase orders
            </Link>
            <button
              type="button"
              className="clay-btn inline-flex min-h-10 items-center gap-1.5 text-sm"
              onClick={() => setShowForm((v) => !v)}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              New
            </button>
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

      {showForm ? (
        <form className="clay-panel mb-4 grid gap-3 p-3 sm:grid-cols-2 sm:p-4" onSubmit={onCreate}>
          <label className="block text-xs">
            <span className="mb-1 block font-medium text-[var(--muted-foreground)]">Code</span>
            <input
              className="clay-input min-h-10 w-full text-sm"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              placeholder="OKHLA-PKG"
            />
          </label>
          <label className="block text-xs">
            <span className="mb-1 block font-medium text-[var(--muted-foreground)]">Name</span>
            <input
              className="clay-input min-h-10 w-full text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label className="block text-xs">
            <span className="mb-1 block font-medium text-[var(--muted-foreground)]">Contact</span>
            <input
              className="clay-input min-h-10 w-full text-sm"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
          </label>
          <label className="block text-xs">
            <span className="mb-1 block font-medium text-[var(--muted-foreground)]">Phone</span>
            <input
              className="clay-input min-h-10 w-full text-sm"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
          <label className="block text-xs">
            <span className="mb-1 block font-medium text-[var(--muted-foreground)]">Email</span>
            <input
              className="clay-input min-h-10 w-full text-sm"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block text-xs">
            <span className="mb-1 block font-medium text-[var(--muted-foreground)]">City</span>
            <input
              className="clay-input min-h-10 w-full text-sm"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </label>
          <label className="block text-xs">
            <span className="mb-1 block font-medium text-[var(--muted-foreground)]">State</span>
            <input
              className="clay-input min-h-10 w-full text-sm"
              value={state}
              onChange={(e) => setState(e.target.value)}
            />
          </label>
          <label className="block text-xs">
            <span className="mb-1 block font-medium text-[var(--muted-foreground)]">GSTIN</span>
            <input
              className="clay-input min-h-10 w-full text-sm"
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
            />
          </label>
          <div className="flex items-end gap-2 sm:col-span-2">
            <button type="submit" className="clay-btn min-h-10 text-sm" disabled={busy}>
              Save
            </button>
            <button
              type="button"
              className="clay-btn-secondary min-h-10 text-sm"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </div>
        </form>
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
          <Truck className="h-8 w-8 opacity-30" aria-hidden />
          <p className="text-sm opacity-70">No suppliers yet.</p>
        </div>
      ) : null}

      {!loading && rows.length > 0 ? (
        <OpsTableScroll>
          <div className="clay-panel overflow-hidden">
            <table className="w-full min-w-[36rem] border-collapse text-sm">
              <thead>
                <tr className="ops-th border-b border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--foreground)_3.5%,transparent)] text-left">
                  <th className="px-3 py-2.5 font-medium">Code</th>
                  <th className="px-2 py-2.5 font-medium">Name</th>
                  <th className="px-2 py-2.5 font-medium">City</th>
                  <th className="px-2 py-2.5 font-medium">Contact</th>
                  <th className="px-2 py-2.5 font-medium">POs</th>
                  <th className="px-2 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id} className="border-b border-[var(--border-subtle)]">
                    <td className="px-3 py-2.5 font-mono text-xs">{s.code}</td>
                    <td className="px-2 py-2.5 font-medium">{s.name}</td>
                    <td className="px-2 py-2.5 text-[var(--muted-foreground)]">
                      {[s.city, s.state].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="px-2 py-2.5 text-xs text-[var(--muted-foreground)]">
                      {s.contactName || s.phone || s.email || '—'}
                    </td>
                    <td className="px-2 py-2.5 tabular-nums">{s.poCount}</td>
                    <td className="px-2 py-2.5">
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                          s.isActive
                            ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {s.isActive ? 'Active' : 'Off'}
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
