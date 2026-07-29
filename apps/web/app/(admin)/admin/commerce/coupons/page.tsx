'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';
import { formatInr } from '@/lib/catalog';
import { OpsPageHeader } from '@/components/commerce-ops/ops-page-header';
import { OpsTableScroll } from '@/components/commerce-ops/ops-table-scroll';

type CouponRow = {
  id: string;
  code: string;
  description: string | null;
  type: 'PERCENT' | 'FIXED_PAISE';
  discountPercent: number | null;
  discountPaise: number | null;
  minSubtotalPaise: number;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  status: 'off' | 'scheduled' | 'active' | 'expired' | 'exhausted';
};

type BenefitKind = 'percent' | 'fixed';

function generateCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `GIFT-${suffix}`;
}

function statusTone(status: CouponRow['status']): string {
  if (status === 'active') return 'bg-emerald-100 text-emerald-900';
  if (status === 'scheduled') return 'bg-sky-100 text-sky-900';
  if (status === 'expired' || status === 'exhausted') return 'bg-amber-100 text-amber-900';
  return 'bg-neutral-200 text-neutral-700';
}

export default function AdminCouponsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<CouponRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [benefit, setBenefit] = useState<BenefitKind>('percent');
  const [percent, setPercent] = useState('10');
  const [fixedRupees, setFixedRupees] = useState('100');
  const [minOrderRupees, setMinOrderRupees] = useState('500');
  const [maxUses, setMaxUses] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [previewSubtotalRupees, setPreviewSubtotalRupees] = useState('1000');
  const [previewResult, setPreviewResult] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setRows(await apiAuth<CouponRow[]>('/admin/commerce/coupons'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace('/login?next=/admin/commerce/coupons');
      return;
    }
    load().catch(() => router.replace('/login?next=/admin/commerce/coupons'));
  }, [router]);

  const draftBody = useMemo(() => {
    const minSubtotalPaise = Math.max(0, Math.round(Number(minOrderRupees || '0') * 100));
    const base: Record<string, unknown> = {
      code: code.trim().toUpperCase() || 'DRAFT',
      description: description.trim() || undefined,
      minSubtotalPaise,
      maxUses: maxUses.trim() ? Number(maxUses) : undefined,
      startsAt: startsAt || undefined,
      expiresAt: expiresAt || undefined,
    };
    if (benefit === 'percent') {
      base.discountPercent = Number(percent);
    } else {
      base.discountPaise = Math.round(Number(fixedRupees || '0') * 100);
    }
    return base;
  }, [
    code,
    description,
    benefit,
    percent,
    fixedRupees,
    minOrderRupees,
    maxUses,
    startsAt,
    expiresAt,
  ]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const { code: _c, ...rest } = draftBody;
      await apiAuth('/admin/commerce/coupons', {
        method: 'POST',
        json: { ...rest, code: code.trim().toUpperCase() },
      });
      await load();
      setCode('');
      setDescription('');
      setMsg('Promotion created');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setBusy(false);
    }
  }

  async function toggle(c: CouponRow) {
    setBusy(true);
    setError(null);
    try {
      await apiAuth(`/admin/commerce/coupons/${encodeURIComponent(c.code)}`, {
        method: 'PATCH',
        json: { active: !c.active },
      });
      await load();
      setMsg(c.active ? `${c.code} deactivated` : `${c.code} activated`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  }

  async function runPreview(mode: 'draft' | 'code', existingCode?: string) {
    setPreviewResult(null);
    setError(null);
    const subtotalPaise = Math.round(Number(previewSubtotalRupees || '0') * 100);
    try {
      const body =
        mode === 'code' && existingCode
          ? { subtotalPaise, code: existingCode }
          : {
              subtotalPaise,
              discountPercent:
                benefit === 'percent' ? Number(percent) : undefined,
              discountPaise:
                benefit === 'fixed' ? Math.round(Number(fixedRupees || '0') * 100) : undefined,
              minSubtotalPaise: Math.max(0, Math.round(Number(minOrderRupees || '0') * 100)),
            };
      const res = await apiAuth<{
        ok: boolean;
        message?: string;
        discountPaise?: number;
        totalAfterPaise?: number;
      }>('/admin/commerce/coupons/preview', { method: 'POST', json: body });
      if (!res.ok) {
        setPreviewResult(res.message ?? 'Would not apply');
      } else {
        setPreviewResult(
          `Discount ${formatInr(res.discountPaise ?? 0)} → total ${formatInr(res.totalAfterPaise ?? 0)}`,
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Preview failed');
    }
  }

  return (
    <div>
      <OpsPageHeader
        title="Promotions"
        description="Cart % or fixed paise · min order · schedule · usage. One coupon per cart (stack matrix = P2)."
        actions={
          <Link href="/admin/commerce/reports" className="clay-btn-secondary text-sm">
            Reports
          </Link>
        }
      />

      {msg ? <p className="mb-3 text-sm text-emerald-800">{msg}</p> : null}
      {error ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}

      <form
        onSubmit={(e) => void onCreate(e)}
        className="mb-8 grid max-w-2xl gap-3 rounded border border-[color:var(--gift-line)] p-4 text-sm"
      >
        <p className="text-xs font-medium uppercase tracking-wide opacity-70">
          Builder — conditions → benefit → schedule → preview
        </p>

        <div className="flex flex-wrap gap-2">
          <label className="min-w-[8rem] flex-1 text-xs">
            Code
            <input
              className="mt-1 block w-full min-h-10 rounded border px-2 py-1 font-mono text-sm uppercase"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              pattern="[A-Za-z0-9_-]{2,40}"
            />
          </label>
          <button
            type="button"
            className="clay-btn-secondary mt-5 min-h-10 self-start px-3 text-sm"
            onClick={() => setCode(generateCode())}
          >
            Generate
          </button>
        </div>

        <label className="block text-xs">
          Description
          <input
            className="mt-1 block w-full min-h-10 rounded border px-2 py-1 text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Welcome gift off"
          />
        </label>

        <fieldset className="space-y-2">
          <legend className="text-xs opacity-70">Benefit</legend>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-1 text-sm">
              <input
                type="radio"
                checked={benefit === 'percent'}
                onChange={() => setBenefit('percent')}
              />
              Percent off
            </label>
            <label className="flex items-center gap-1 text-sm">
              <input
                type="radio"
                checked={benefit === 'fixed'}
                onChange={() => setBenefit('fixed')}
              />
              Fixed ₹
            </label>
          </div>
          {benefit === 'percent' ? (
            <label className="block text-xs">
              Percent
              <input
                className="mt-1 block w-24 min-h-10 rounded border px-2 py-1 text-sm"
                value={percent}
                onChange={(e) => setPercent(e.target.value)}
                required
              />
            </label>
          ) : (
            <label className="block text-xs">
              Amount (₹)
              <input
                className="mt-1 block w-28 min-h-10 rounded border px-2 py-1 text-sm"
                value={fixedRupees}
                onChange={(e) => setFixedRupees(e.target.value)}
                required
              />
            </label>
          )}
        </fieldset>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs">
            Min order (₹)
            <input
              className="mt-1 block w-full min-h-10 rounded border px-2 py-1 text-sm"
              value={minOrderRupees}
              onChange={(e) => setMinOrderRupees(e.target.value)}
            />
          </label>
          <label className="block text-xs">
            Max uses (optional)
            <input
              className="mt-1 block w-full min-h-10 rounded border px-2 py-1 text-sm"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="unlimited"
            />
          </label>
          <label className="block text-xs">
            Starts at
            <input
              type="datetime-local"
              className="mt-1 block w-full min-h-10 rounded border px-2 py-1 text-sm"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />
          </label>
          <label className="block text-xs">
            Expires at
            <input
              type="datetime-local"
              className="mt-1 block w-full min-h-10 rounded border px-2 py-1 text-sm"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </label>
        </div>

        <div className="flex flex-wrap items-end gap-2 rounded border border-dashed p-3">
          <label className="text-xs">
            Preview cart subtotal (₹)
            <input
              className="mt-1 block w-32 min-h-10 rounded border px-2 py-1 text-sm"
              value={previewSubtotalRupees}
              onChange={(e) => setPreviewSubtotalRupees(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="clay-btn-secondary min-h-10 px-3 text-sm"
            onClick={() => void runPreview('draft')}
          >
            Preview draft
          </button>
          {previewResult ? <p className="w-full text-xs opacity-80">{previewResult}</p> : null}
        </div>

        <button type="submit" className="clay-btn w-fit text-sm disabled:opacity-50" disabled={busy}>
          Create promotion
        </button>
      </form>

      <h2 className="mb-2 text-sm font-medium">All promotions</h2>
      {loading ? <p className="text-sm opacity-70">Loading…</p> : null}
      {!loading && rows.length === 0 ? (
        <p className="text-sm opacity-70">No coupons yet.</p>
      ) : null}

      {!loading && rows.length > 0 ? (
        <OpsTableScroll>
          <table className="w-full min-w-[44rem] border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide opacity-70">
                <th className="py-2 pr-3">Code</th>
                <th className="py-2 pr-3">Type</th>
                <th className="py-2 pr-3">Benefit</th>
                <th className="py-2 pr-3">Schedule</th>
                <th className="py-2 pr-3">Usage</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-b align-top">
                  <td className="py-2 pr-3 font-mono text-xs">{c.code}</td>
                  <td className="py-2 pr-3 text-xs">{c.type}</td>
                  <td className="py-2 pr-3">
                    {c.discountPercent != null
                      ? `${c.discountPercent}%`
                      : formatInr(c.discountPaise ?? 0)}
                    <p className="text-xs opacity-60">min {formatInr(c.minSubtotalPaise)}</p>
                  </td>
                  <td className="py-2 pr-3 text-xs opacity-80">
                    {c.startsAt || c.expiresAt ? (
                      <>
                        {c.startsAt ? (
                          <span className="block">from {new Date(c.startsAt).toLocaleString('en-IN')}</span>
                        ) : null}
                        {c.expiresAt ? (
                          <span className="block">until {new Date(c.expiresAt).toLocaleString('en-IN')}</span>
                        ) : (
                          <span className="block">no end</span>
                        )}
                      </>
                    ) : (
                      'always'
                    )}
                  </td>
                  <td className="py-2 pr-3">
                    {c.usedCount}
                    {c.maxUses != null ? ` / ${c.maxUses}` : ''}
                  </td>
                  <td className="py-2 pr-3">
                    <span
                      className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${statusTone(c.status)}`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="py-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="underline text-xs"
                        disabled={busy}
                        onClick={() => void toggle(c)}
                      >
                        {c.active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        type="button"
                        className="underline text-xs"
                        onClick={() => void runPreview('code', c.code)}
                      >
                        Preview
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </OpsTableScroll>
      ) : null}
    </div>
  );
}
