'use client';

import Link from 'next/link';
import { FormEvent, Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RefreshCw, Search, X } from 'lucide-react';
import { apiAuth, getStoredAccessToken, loginUrl } from '@/lib/auth-client';
import { COMMERCE_OPS_NAV } from '@/lib/commerce-ops-nav';
import { opsChipClass } from '@/lib/ops-desk-ui';
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
  const [loading, setLoading] = useState(true);

  const [auditQ, setAuditQ] = useState(searchParams.get('q') ?? '');
  const [auditAction, setAuditAction] = useState(searchParams.get('action') ?? '');
  const [auditPage, setAuditPage] = useState(1);
  const [audit, setAudit] = useState<AuditPage | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);

  const loadPolicy = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load policy');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAudit = useCallback(async () => {
    setAuditLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (auditQ.trim()) params.set('q', auditQ.trim());
      if (auditAction.trim()) params.set('action', auditAction.trim());
      params.set('page', String(auditPage));
      params.set('pageSize', '25');
      const data = await apiAuth<AuditPage>(`/admin/commerce/audit?${params}`);
      setAudit(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load audit');
    } finally {
      setAuditLoading(false);
    }
  }, [auditQ, auditAction, auditPage]);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace(loginUrl('/admin/commerce/settings'));
      return;
    }
    void loadPolicy();
  }, [router, loadPolicy]);

  useEffect(() => {
    if (tab !== 'audit') return;
    if (!getStoredAccessToken()) return;
    void loadAudit();
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
      setMsg('Policy saved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <OpsPageHeader
        title="Settings"
        actions={
          <>
            <Link href="/admin/platform/flags" className="clay-btn-ghost min-h-10 text-sm">
              Feature flags
            </Link>
            <button
              type="button"
              className="clay-btn-secondary inline-flex min-h-10 items-center gap-1.5 text-sm"
              disabled={loading || busy || (tab === 'audit' && auditLoading)}
              onClick={() => {
                if (tab === 'audit') void loadAudit();
                else void loadPolicy();
              }}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 opacity-70 ${
                  loading || (tab === 'audit' && auditLoading) ? 'animate-spin' : ''
                }`}
                aria-hidden
              />
              Refresh
            </button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap gap-1.5" role="tablist" aria-label="Settings sections">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'policy'}
          className={opsChipClass(tab === 'policy')}
          onClick={() => setTab('policy')}
        >
          Policy
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'audit'}
          className={opsChipClass(tab === 'audit')}
          onClick={() => setTab('audit')}
        >
          Audit log
        </button>
      </div>

      {msg ? (
        <p
          className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
          role="status"
        >
          {msg}
        </p>
      ) : null}
      {error ? (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      {tab === 'policy' ? (
        loading ? (
          <div className="clay-panel space-y-3 p-4" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-lg bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]"
              />
            ))}
          </div>
        ) : (
          <div className="grid max-w-2xl gap-4">
            <form
              onSubmit={(e) => void onSavePolicy(e)}
              className="clay-panel space-y-3 p-4 text-sm"
            >
              <h2 className="font-display text-lg leading-tight">Commerce policy</h2>
              {policy ? (
                <p className="text-xs text-[var(--muted-foreground)]">
                  Live · {policy.returnWindowDays}d returns · low stock ≤{policy.lowStockThreshold}
                </p>
              ) : null}
              <label className="block text-xs">
                Return window (days)
                <input
                  className="clay-input mt-1 block w-full min-h-10 text-sm"
                  type="number"
                  min={1}
                  max={365}
                  value={returnWindowDays}
                  onChange={(e) => setReturnWindowDays(e.target.value)}
                  required
                />
              </label>
              <label className="block text-xs">
                Low-stock threshold
                <input
                  className="clay-input mt-1 block w-full min-h-10 text-sm"
                  type="number"
                  min={0}
                  max={1000}
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  required
                />
              </label>
              <label className="block text-xs">
                Shipping display copy
                <textarea
                  className="clay-input mt-1 block w-full min-h-[5rem] resize-y py-2 text-sm"
                  rows={3}
                  value={shippingCopy}
                  onChange={(e) => setShippingCopy(e.target.value)}
                  required
                />
              </label>
              <button
                type="submit"
                className="clay-btn text-sm disabled:opacity-50"
                disabled={busy}
              >
                Save policy
              </button>
            </form>

            <section className="clay-panel p-4 text-sm">
              <h2 className="font-display text-lg leading-tight">Dashboard alerts</h2>
              <ul className="mt-3 space-y-1">
                {ALERT_PREF_ROWS.map((row) => (
                  <li key={row.key}>
                    <label className="flex min-h-10 cursor-pointer items-center gap-2.5 rounded-lg px-1 hover:bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]">
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
                      setMsg('Alert prefs saved');
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

            <section className="clay-panel p-4 text-sm">
              <h2 className="font-display text-lg leading-tight">PDP trust strip</h2>
              <ul className="mt-3 space-y-3">
                {trustCues.map((cue, i) => (
                  <li
                    key={i}
                    className="grid gap-2 rounded-lg border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--foreground)_2%,transparent)] p-3 sm:grid-cols-[7rem_1fr]"
                  >
                    <label className="block text-xs">
                      Icon
                      <select
                        className="clay-input mt-1 block w-full min-h-10 text-sm"
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
                          className="clay-input mt-1 block w-full min-h-10 text-sm"
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
                          className="clay-input mt-1 block w-full min-h-10 text-sm"
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
                    className="clay-btn-ghost text-sm disabled:opacity-50"
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
                        setMsg('Trust strip saved');
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

            <section className="clay-panel overflow-hidden p-4 text-sm">
              <h2 className="font-display text-lg leading-tight">Roles</h2>
              <OpsTableScroll>
                <table className="mt-3 w-full min-w-[28rem] border-collapse text-xs">
                  <thead>
                    <tr className="ops-th border-b border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--foreground)_3.5%,transparent)] text-left">
                      <th className="py-2 pr-2 font-medium">Nav</th>
                      {ROLE_COLS.map((r) => (
                        <th key={r} className="py-2 pr-2 font-medium">
                          {r.replace('_', ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COMMERCE_OPS_NAV.map((item) => (
                      <tr key={item.id} className="border-b border-[var(--border-subtle)]">
                        <td className="py-1.5 pr-2">{item.label}</td>
                        {ROLE_COLS.map((r) => (
                          <td key={r} className="py-1.5 pr-2">
                            {item.roles.includes(r) ? (
                              <span className="text-[var(--success)]">✓</span>
                            ) : (
                              <span className="opacity-30">—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </OpsTableScroll>
            </section>

            <section className="clay-panel p-4 text-sm">
              <h2 className="font-display text-lg leading-tight">Related</h2>
              <ul className="mt-2 flex flex-wrap gap-2">
                <li>
                  <Link href="/admin/commerce/merchandising" className="clay-chip text-xs">
                    Merchandising
                  </Link>
                </li>
                <li>
                  <Link href="/admin/cms/gift-chrome" className="clay-chip text-xs">
                    Gift chrome
                  </Link>
                </li>
                <li>
                  <Link href="/admin/platform/flags" className="clay-chip text-xs">
                    Feature flags
                  </Link>
                </li>
                <li>
                  <Link href="/admin/commerce" className="clay-chip text-xs">
                    Dashboard
                  </Link>
                </li>
              </ul>
            </section>
          </div>
        )
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
            <div className="min-w-0 flex-1 sm:max-w-xs">
              <div className="flex min-h-9 items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[color-mix(in_srgb,var(--surface)_92%,white)] px-3 shadow-sm">
                <Search
                  className="h-3.5 w-3.5 shrink-0 text-[var(--primary)] opacity-70"
                  aria-hidden
                />
                <input
                  className="min-w-0 flex-1 bg-transparent py-1.5 text-sm outline-none placeholder:opacity-50"
                  value={auditQ}
                  onChange={(e) => setAuditQ(e.target.value)}
                  placeholder="Search action, email, id"
                  aria-label="Search audit"
                />
                {auditQ ? (
                  <button
                    type="button"
                    className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full opacity-70 hover:opacity-100"
                    aria-label="Clear search"
                    onClick={() => setAuditQ('')}
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </button>
                ) : null}
              </div>
            </div>
            <label className="text-xs">
              Action
              <input
                className="clay-input mt-1 block w-full min-h-10 text-sm sm:w-40"
                value={auditAction}
                onChange={(e) => setAuditAction(e.target.value)}
                placeholder="refund / policy"
              />
            </label>
            <button type="submit" className="clay-btn-secondary min-h-10 px-3 text-sm">
              Filter
            </button>
          </form>

          {auditLoading && !audit ? (
            <div className="clay-panel space-y-3 p-4" aria-busy="true">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-8 animate-pulse rounded bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]"
                />
              ))}
            </div>
          ) : (
            <>
              <div className="md:hidden">
                {!audit || audit.items.length === 0 ? (
                  <div className="clay-panel px-6 py-10 text-center text-sm opacity-70">
                    No audit rows.
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {audit.items.map((row) => (
                      <li key={row.id} className="clay-panel p-2.5 text-sm">
                        <p className="font-mono text-xs">{row.action}</p>
                        <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                          {row.actor?.email ?? '—'}
                          {row.resource ? ` · ${row.resource}` : ''}
                        </p>
                        <time
                          className="mt-1 block text-[11px] opacity-50"
                          dateTime={row.createdAt}
                        >
                          {new Date(row.createdAt).toLocaleString('en-IN')}
                        </time>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="hidden md:block">
                <OpsTableScroll>
                  <div className="clay-panel overflow-hidden">
                    <table className="w-full min-w-[40rem] border-collapse text-sm">
                      <thead>
                        <tr className="ops-th border-b border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--foreground)_3.5%,transparent)] text-left">
                          <th className="px-3 py-2.5 font-medium">When</th>
                          <th className="px-2 py-2.5 pr-3 font-medium">Actor</th>
                          <th className="px-2 py-2.5 pr-3 font-medium">Action</th>
                          <th className="px-2 py-2.5 pr-3 font-medium">Resource</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!audit || audit.items.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-3 py-6 text-center opacity-70">
                              No audit rows.
                            </td>
                          </tr>
                        ) : (
                          audit.items.map((row) => (
                            <tr
                              key={row.id}
                              className="border-b border-[var(--border-subtle)] hover:bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]"
                            >
                              <td className="whitespace-nowrap px-3 py-2 text-xs">
                                {new Date(row.createdAt).toLocaleString('en-IN')}
                              </td>
                              <td className="px-2 py-2 pr-3 text-xs">{row.actor?.email ?? '—'}</td>
                              <td className="px-2 py-2 pr-3 font-mono text-xs">{row.action}</td>
                              <td className="px-2 py-2 pr-3 text-xs">
                                {row.resource ?? '—'}
                                {row.resourceId ? (
                                  <span className="ml-1 opacity-50">
                                    {row.resourceId.slice(0, 8)}…
                                  </span>
                                ) : null}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </OpsTableScroll>
              </div>

              {audit && audit.total > audit.pageSize ? (
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <button
                    type="button"
                    className="clay-btn-ghost min-h-9 px-3 text-sm disabled:opacity-40"
                    disabled={auditPage <= 1}
                    onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </button>
                  <span className="text-xs opacity-70">
                    Page {audit.page} · {audit.total} total
                  </span>
                  <button
                    type="button"
                    className="clay-btn-ghost min-h-9 px-3 text-sm disabled:opacity-40"
                    disabled={audit.page * audit.pageSize >= audit.total}
                    onClick={() => setAuditPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function CommerceSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="clay-panel space-y-3 p-4" aria-busy="true">
          <div className="h-8 w-40 animate-pulse rounded bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
          <div className="h-32 animate-pulse rounded-lg bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
        </div>
      }
    >
      <SettingsInner />
    </Suspense>
  );
}
