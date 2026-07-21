'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';

type CouponRow = {
  code: string;
  description: string | null;
  active: boolean;
  usedCount: number;
  discountPercent: number | null;
  discountPaise: number | null;
};

export default function AdminCouponsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<CouponRow[]>([]);
  const [code, setCode] = useState('');
  const [percent, setPercent] = useState('10');
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setRows(await apiAuth<CouponRow[]>('/admin/commerce/coupons'));
  }

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace('/login?next=/admin/commerce/coupons');
      return;
    }
    load().catch(() => router.replace('/login?next=/admin/commerce/coupons'));
  }, [router]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    await apiAuth('/admin/commerce/coupons', {
      method: 'POST',
      json: { code, discountPercent: Number(percent), minSubtotalPaise: 50000 },
    });
    await load();
    setCode('');
    setMsg('Coupon created');
  }

  async function toggle(c: CouponRow) {
    await apiAuth(`/admin/commerce/coupons/${encodeURIComponent(c.code)}`, {
      method: 'PATCH',
      json: { active: !c.active },
    });
    await load();
    setMsg(c.active ? `${c.code} deactivated` : `${c.code} activated`);
  }

  return (
    <main className="min-h-screen p-8 max-w-lg">
      <Link href="/admin/commerce" className="text-sm underline opacity-70">
        ← Dashboard
      </Link>
      <h1 className="text-2xl font-semibold mt-4">Coupons</h1>
      {msg ? <p className="mt-2 text-sm text-green-700">{msg}</p> : null}
      <ul className="mt-4 text-sm space-y-2">
        {rows.map((c) => (
          <li key={c.code} className="flex items-center justify-between gap-2 rounded border p-2">
            <span>
              {c.code}
              {c.discountPercent != null ? ` · ${c.discountPercent}%` : ''}
              {c.discountPaise != null ? ` · ₹${c.discountPaise / 100}` : ''}
              {' · '}
              {c.usedCount} uses
              {!c.active ? ' [off]' : ''}
            </span>
            <button type="button" className="underline text-xs" onClick={() => void toggle(c)}>
              {c.active ? 'Deactivate' : 'Activate'}
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={(e) => void onCreate(e)} className="mt-6 flex gap-2 text-sm">
        <input
          className="rounded border px-2 py-1"
          placeholder="CODE"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
        <input
          className="w-16 rounded border px-2 py-1"
          value={percent}
          onChange={(e) => setPercent(e.target.value)}
          aria-label="Percent off"
        />
        <button type="submit" className="rounded border px-3 py-1">
          Create
        </button>
      </form>
    </main>
  );
}
