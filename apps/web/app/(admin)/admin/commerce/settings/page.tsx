'use client';

import Link from 'next/link';
import { FormEvent, Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';
import { COMMERCE_OPS_NAV } from '@/lib/commerce-ops-nav';
import { OpsPageHeader } from '@/components/commerce-ops/ops-page-header';
import { OpsTableScroll } from '@/components/commerce-ops/ops-table-scroll';

type Policy = {
  returnWindowDays: number;
  lowStockThreshold: number;
  shippingDisplayCopy: string;
  dashboardAlertPrefs: {
    failedPayments: boolean;
    awaitingProcess: boolean;
    pendingShip: boolean;
    openReturns: boolean;
    lowStock: boolean;
  };
  trustCues: TrustCueRow[];
};

type TrustCueRow = {
  title: string;
  body: string;
  icon: 'lock' | 'returns' | 'gift';
};

type AuditItem = {
  id: string;
  action: string;
  resource: string | null;
  resourceId: string | null;
  metadata: unknown;
  createdAt: string;
  actor: { id: string; email: string; displayName: string | null } | null;
};

type AuditPage = {
  page: number;
  pageSize: number;
  total: number;
  items: AuditItem[];
};

const ROLE_COLS = ['COMMERCE_ADMIN', 'SUPPORT', 'FINANCE'] as const;

const ALERT_PREF_ROWS: Array<{
  key: keyof Policy['dashboardAlertPrefs'];
  label: string;
}> = [
  { key: 'failedPayments', label: 'Failed payments' },
  { key: 'awaitingProcess', label: 'Awaiting process' },
  { key: 'pendingShip', label: 'Ready to ship' },
  { key: 'openReturns', label: 'Open returns' },
  { key: 'lowStock', label: 'Low stock SKUs' },
];

const DEFAULT_ALERT_PREFS: Policy['dashboardAlertPrefs'] = {
  failedPayments: true,
  awaitingProcess: true,
  pendingShip: true,
  openReturns: true,
  lowStock: true,
};

const DEFAULT_TRUST_CUES: TrustCueRow[] = [
  {
    title: 'Secure checkout',
    body: 'Encrypted payment — your details stay private.',
    icon: 'lock',
  },
  {
    title: '14-day returns',
    body: 'Easy returns after delivery within the window.',
    icon: 'returns',
  },
  {
    title: 'Gift-box ready',
    body: 'Many pieces are eligible for Build Your Box.',
    icon: 'gift',
  },
];

const TRUST_ICON_OPTIONS: Array<{ value: TrustCueRow['icon']; label: string }> = [
  { value: 'lock', label: 'Lock' },
  { value: 'returns', label: 'Returns' },
  { value: 'gift', label: 'Gift' },
];

function SettingsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') === 'audit' ? 'audit' : 'policy';

  const [policy, setPolicy] = useState<Policy | null>(null);
  const [returnWindowDays, setReturnWindowDays] = useState('14');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [shippingCopy, setShippingCopy] = useState('');
  const [alertPrefs, setAlertPrefs] = useState(DEFAULT_ALERT_PREFS);
  const [trustCues, setTrustCues] = useState<TrustCueRow[]>(DEFAULT_TRUST_CUES);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [auditQ, setAuditQ] = useState(searchParams.get('q') ?? '');
  const [auditAction, setAuditAction] = useState(searchParams.get('action') ?? '');
  const [auditPage, setAuditPage] = useState(1);
  const [audit, setAudit] = useState<AuditPage | null>(null);

  const loadPolicy = useCallback(async () => {
    const p = await apiAuth<Policy>('/admin/commerce/policy');
    setPolicy(p);
    setReturnWindowDays(String(p.returnWindowDays));
    setLowStockThreshold(String(p.lowStockThreshold));
    setShippingCopy(p.shippingDisplayCopy);
    setAlertPrefs(p.dashboardAlertPrefs ?? DEFAULT_ALERT_PREFS);
    setTrustCues(
      p.trustCues?.length
        ? p.trustCues.map((c) => ({ ...c }))
        : DEFAULT_TRUST_CUES.map((c) => ({ ...c })),
    );
  }, []);

  const loadAudit = useCallback(async () => {
    const params = new URLSearchParams();
    if (auditQ.trim()) params.set('q', auditQ.trim());
    if (auditAction.trim()) params.set('action', auditAction.trim());
    params.set('page', String(auditPage));
    params.set('pageSize', '25');
    const data = await apiAuth<AuditPage>(`/admin/commerce/audit?${params}`);
    setAudit(data);
  }, [auditQ, auditAction, auditPage]);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace('/login?next=/admin/commerce/settings');
      return;
    }
    loadPolicy().catch((e) =>
      setError(e instanceof Error ? e.message : 'Failed to load policy'),
    );
  }, [router, loadPolicy]);

  useEffect(() => {
    if (tab !== 'audit') return;
    if (!getStoredAccessToken()) return;
    loadAudit().catch((e) =>
      setError(e instanceof Error ? e.message : 'Failed to load audit'),
    );
  }, [tab, loadAudit]);

  function setTab(next: 'policy' | 'audit') {
    const params = new URLSearchParams();
    if (next === 'audit') params.set('tab', 'audit');
    router.push(`/admin/commerce/settings${params.toString() ? `?${params}` : ''}`);
  }

  async function onSavePolicy(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const updated = await apiAuth<Policy>('/admin/commerce/policy', {
        method: 'POST',
        json: {
          returnWindowDays: Number(returnWindowDays),
          lowStockThreshold: Number(lowStockThreshold),
          shippingDisplayCopy: shippingCopy.trim(),
          dashboardAlertPrefs: alertPrefs,
        },
      });
      setPolicy(updated);
      setAlertPrefs(updated.dashboardAlertPrefs ?? DEFAULT_ALERT_PREFS);
      setMsg('Policy saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <OpsPageHeader
        title="Settings & trust"
        description="Ops-owned policy without redeploy. Privileged actions stay inspectable."
        actions={
          <Link href="/admin/platform/flags" className="clay-btn-secondary text-sm">
            Feature flags
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <button
          type="button"
          className={`min-h-10 rounded border px-3 ${tab === 'policy' ? 'bg-neutral-900 text-white' : ''}`}
          onClick={() => setTab('policy')}
        >
          Policy
        </button>
        <button
          type="button"
          className={`min-h-10 rounded border px-3 ${tab === 'audit' ? 'bg-neutral-900 text-white' : ''}`}
          onClick={() => setTab('audit')}
        >
          Audit log
        </button>
      </div>

      {msg ? <p className="mb-3 text-sm text-emerald-800">{msg}</p> : null}
      {error ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}

      {tab === 'policy' ? (
        <div className="grid max-w-2xl gap-6">
          <form
            onSubmit={(e) => void onSavePolicy(e)}
            className="space-y-3 rounded border border-[color:var(--gift-line)] p-4 text-sm"
          >
            <h2 className="text-xs font-medium uppercase tracking-wide opacity-70">
              Commerce policy
            </h2>
            <label className="block text-xs">
              Return window (days after delivery)
              <input
                className="mt-1 block w-full min-h-10 rounded border px-2 py-1 text-sm"
                type="number"
                min={1}
                max={365}
                value={returnWindowDays}
                onChange={(e) => setReturnWindowDays(e.target.value)}
                required
              />
            </label>
            <label className="block text-xs">
              Low-stock threshold (units)
              <input
                className="mt-1 block w-full min-h-10 rounded border px-2 py-1 text-sm"
                type="number"
                min={0}
                max={1000}
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                required
              />
            </label>
            <label className="block text-xs">
              Shipping display copy (storefront stub)
              <textarea
                className="mt-1 block w-full rounded border px-2 py-1 text-sm"
                rows={3}
                value={shippingCopy}
                onChange={(e) => setShippingCopy(e.target.value)}
                required
              />
            </label>
            <button type="submit" className="clay-btn text-sm disabled:opacity-50" disabled={busy}>
              Save policy
            </button>
            {policy ? (
              <p className="text-xs opacity-60">
                Live: {policy.returnWindowDays}d returns · low stock ≤{policy.lowStockThreshold}
              </p>
            ) : null}
          </form>

          <section className="rounded border border-[color:var(--gift-line)] p-4 text-sm">
            <h2 className="text-xs font-medium uppercase tracking-wide opacity-70">
              Dashboard alerts
            </h2>
            <ul className="mt-3 space-y-2">
              {ALERT_PREF_ROWS.map((row) => (
                <li key={row.key}>
                  <label className="flex min-h-10 cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[var(--primary)]"
                      checked={alertPrefs[row.key]}
                      onChange={(e) =>
                        setAlertPrefs((prev) => ({ ...prev, [row.key]: e.target.checked }))
                      }
                    />
                    <span>{row.label}</span>
                  </label>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="clay-btn-secondary mt-3 text-sm disabled:opacity-50"
              disabled={busy}
              onClick={() => {
                void (async () => {
                  setBusy(true);
                  setError(null);
                  setMsg(null);
                  try {
                    const updated = await apiAuth<Policy>('/admin/commerce/policy', {
                      method: 'POST',
                      json: { dashboardAlertPrefs: alertPrefs },
                    });
                    setPolicy(updated);
                    setAlertPrefs(updated.dashboardAlertPrefs ?? DEFAULT_ALERT_PREFS);
                    setMsg('Alert prefs saved.');
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Save failed');
                  } finally {
                    setBusy(false);
                  }
                })();
              }}
            >
              Save alert prefs
            </button>
          </section>

          <section className="rounded border border-[color:var(--gift-line)] p-4 text-sm">
            <h2 className="text-xs font-medium uppercase tracking-wide opacity-70">
              PDP trust strip
            </h2>
            <ul className="mt-3 space-y-4">
              {trustCues.map((cue, i) => (
                <li
                  key={i}
                  className="grid gap-2 rounded-lg border border-[color:var(--gift-line)] p-3 sm:grid-cols-[7rem_1fr]"
                >
                  <label className="block text-xs">
                    Icon
                    <select
                      className="mt-1 block w-full min-h-10 rounded border px-2 py-1 text-sm"
                      value={cue.icon}
                      onChange={(e) => {
                        const icon = e.target.value as TrustCueRow['icon'];
                        setTrustCues((rows) =>
                          rows.map((r, idx) => (idx === i ? { ...r, icon } : r)),
                        );
                      }}
                    >
                      {TRUST_ICON_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="grid gap-2">
                    <label className="block text-xs">
                      Title
                      <input
                        className="mt-1 block w-full min-h-10 rounded border px-2 py-1 text-sm"
                        value={cue.title}
                        maxLength={80}
                        onChange={(e) => {
                          const title = e.target.value;
                          setTrustCues((rows) =>
                            rows.map((r, idx) => (idx === i ? { ...r, title } : r)),
                          );
                        }}
                        required
                      />
                    </label>
                    <label className="block text-xs">
                      Body
                      <input
                        className="mt-1 block w-full min-h-10 rounded border px-2 py-1 text-sm"
                        value={cue.body}
                        maxLength={200}
                        onChange={(e) => {
                          const body = e.target.value;
                          setTrustCues((rows) =>
                            rows.map((r, idx) => (idx === i ? { ...r, body } : r)),
                          );
                        }}
                        required
                      />
                    </label>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="clay-btn-secondary text-sm disabled:opacity-50"
                disabled={busy || trustCues.length >= 6}
                onClick={() =>
                  setTrustCues((rows) => [
                    ...rows,
                    { title: '', body: '', icon: 'lock' as const },
                  ])
                }
              >
                Add cue
              </button>
              {trustCues.length > 1 ? (
                <button
                  type="button"
                  className="clay-btn-secondary text-sm disabled:opacity-50"
                  disabled={busy}
                  onClick={() => setTrustCues((rows) => rows.slice(0, -1))}
                >
                  Remove last
                </button>
              ) : null}
              <button
                type="button"
                className="clay-btn text-sm disabled:opacity-50"
                disabled={busy}
                onClick={() => {
                  void (async () => {
                    setBusy(true);
                    setError(null);
                    setMsg(null);
                    try {
                      const cleaned = trustCues
                        .map((c) => ({
                          title: c.title.trim(),
                          body: c.body.trim(),
                          icon: c.icon,
                        }))
                        .filter((c) => c.title && c.body);
                      if (cleaned.length === 0) {
                        setError('Add at least one trust cue with title and body.');
                        return;
                      }
                      const updated = await apiAuth<Policy>('/admin/commerce/policy', {
                        method: 'POST',
                        json: { trustCues: cleaned },
                      });
                      setPolicy(updated);
                      setTrustCues(
                        updated.trustCues?.length
                          ? updated.trustCues.map((c) => ({ ...c }))
                          : DEFAULT_TRUST_CUES.map((c) => ({ ...c })),
                      );
                      setMsg('Trust strip saved.');
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Save failed');
                    } finally {
                      setBusy(false);
                    }
                  })();
                }}
              >
                Save trust strip
              </button>
            </div>
          </section>

          <section className="rounded border border-[color:var(--gift-line)] p-4 text-sm">
            <h2 className="text-xs font-medium uppercase tracking-wide opacity-70">
              Roles matrix (read-only)
            </h2>
            <p className="mt-1 text-xs opacity-60">
              What each commerce OPS role sees in the shell. SUPER_ADMIN sees all.
            </p>
            <OpsTableScroll>
              <table className="mt-3 w-full min-w-[28rem] border-collapse text-xs">
                <thead>
                  <tr className="border-b text-left opacity-70">
                    <th className="py-2 pr-2">Nav</th>
                    {ROLE_COLS.map((r) => (
                      <th key={r} className="py-2 pr-2">
                        {r.replace('_', ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMMERCE_OPS_NAV.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="py-1.5 pr-2">{item.label}</td>
                      {ROLE_COLS.map((r) => (
                        <td key={r} className="py-1.5 pr-2">
                          {item.roles.includes(r) ? '✓' : '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </OpsTableScroll>
          </section>

          <section className="rounded border border-[color:var(--gift-line)] p-4 text-sm">
            <h2 className="text-xs font-medium uppercase tracking-wide opacity-70">Related</h2>
            <ul className="mt-2 list-inside list-disc space-y-1 opacity-80">
              <li>
                <Link className="underline" href="/admin/commerce/merchandising">
                  Merchandising
                </Link>
              </li>
              <li>
                <Link className="underline" href="/admin/cms/gift-chrome">
                  Gift chrome
                </Link>
              </li>
              <li>
                <Link className="underline" href="/admin/platform/flags">
                  Feature flags
                </Link>
              </li>
              <li>
                <Link className="underline" href="/admin/commerce">
                  Dashboard
                </Link>
              </li>
            </ul>
          </section>
        </div>
      ) : null}

      {tab === 'audit' ? (
        <div className="space-y-3">
          <form
            className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              setAuditPage(1);
              void loadAudit();
            }}
          >
            <label className="min-w-0 flex-1 text-xs sm:max-w-xs">
              Search
              <input
                className="mt-1 block w-full min-h-10 rounded border px-2 py-1 text-sm"
                value={auditQ}
                onChange={(e) => setAuditQ(e.target.value)}
                placeholder="action, email, resource id"
              />
            </label>
            <label className="text-xs">
              Action contains
              <input
                className="mt-1 block w-full min-h-10 rounded border px-2 py-1 text-sm"
                value={auditAction}
                onChange={(e) => setAuditAction(e.target.value)}
                placeholder="e.g. refund / policy"
              />
            </label>
            <button type="submit" className="clay-btn-secondary min-h-10 px-3 text-sm">
              Filter
            </button>
          </form>

          <OpsTableScroll>
            <table className="w-full min-w-[40rem] border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide opacity-70">
                  <th className="py-2 pr-3">When</th>
                  <th className="py-2 pr-3">Actor</th>
                  <th className="py-2 pr-3">Action</th>
                  <th className="py-2">Resource</th>
                </tr>
              </thead>
              <tbody>
                {!audit || audit.items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 opacity-70">
                      No audit rows.
                    </td>
                  </tr>
                ) : (
                  audit.items.map((row) => (
                    <tr key={row.id} className="border-b align-top">
                      <td className="py-1.5 pr-3 text-xs whitespace-nowrap">
                        {new Date(row.createdAt).toLocaleString('en-IN')}
                      </td>
                      <td className="py-1.5 pr-3 text-xs">{row.actor?.email ?? '—'}</td>
                      <td className="py-1.5 pr-3 font-mono text-xs">{row.action}</td>
                      <td className="py-1.5 text-xs">
                        {row.resource ?? '—'}
                        {row.resourceId ? (
                          <span className="ml-1 opacity-60">{row.resourceId.slice(0, 8)}…</span>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </OpsTableScroll>

          {audit && audit.total > audit.pageSize ? (
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <button
                type="button"
                className="underline disabled:opacity-40"
                disabled={auditPage <= 1}
                onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <span className="opacity-70">
                Page {audit.page} · {audit.total} total
              </span>
              <button
                type="button"
                className="underline disabled:opacity-40"
                disabled={audit.page * audit.pageSize >= audit.total}
                onClick={() => setAuditPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default function CommerceSettingsPage() {
  return (
    <Suspense fallback={<p className="text-sm opacity-70">Loading settings…</p>}>
      <SettingsInner />
    </Suspense>
  );
}
