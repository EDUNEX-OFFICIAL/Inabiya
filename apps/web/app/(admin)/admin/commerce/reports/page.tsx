'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';
import { formatInr } from '@/lib/catalog';

type Daily = { date: string; orders: number; revenuePaise: number };
type StatusRow = { status: string; orders: number; revenuePaise: number };
type Funnel = { days: number; events: Array<{ name: string; count: number }> };

export default function ReportsPage() {
  const router = useRouter();
  const [days, setDays] = useState(7);
  const [daily, setDaily] = useState<Daily[]>([]);
  const [status, setStatus] = useState<StatusRow[]>([]);
  const [funnel, setFunnel] = useState<Funnel | null>(null);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace('/login');
      return;
    }
    Promise.all([
      apiAuth<Daily[]>(`/admin/commerce/reports/daily?days=${days}`),
      apiAuth<StatusRow[]>('/admin/commerce/reports/status'),
      apiAuth<Funnel>(`/admin/commerce/reports/funnel?days=${days}`),
    ])
      .then(([d, s, f]) => {
        setDaily(d);
        setStatus(s);
        setFunnel(f);
      })
      .catch(() => router.replace('/admin/commerce'));
  }, [days, router]);

  return (
    <main className="min-h-screen p-8 max-w-3xl">
      <Link href="/admin/commerce" className="text-sm underline opacity-70">
        ← Ops
      </Link>
      <h1 className="text-2xl font-semibold mt-4">Reports</h1>
      <label className="mt-3 block text-sm">
        Window (days)
        <select
          className="mt-1 rounded border px-2 py-1"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
        >
          {[7, 14, 30].map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>

      <section className="mt-8">
        <h2 className="font-medium text-sm">Daily revenue</h2>
        <table className="mt-2 w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-1">Date</th>
              <th className="py-1">Orders</th>
              <th className="py-1">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {daily.map((r) => (
              <tr key={r.date} className="border-b">
                <td className="py-1">{r.date}</td>
                <td className="py-1">{r.orders}</td>
                <td className="py-1">{formatInr(r.revenuePaise)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-8">
        <h2 className="font-medium text-sm">Orders by status</h2>
        <ul className="mt-2 text-sm space-y-1">
          {status.map((r) => (
            <li key={r.status}>
              {r.status}: {r.orders} · {formatInr(r.revenuePaise)}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="font-medium text-sm">Funnel ({funnel?.days ?? days}d)</h2>
        <ul className="mt-2 text-sm space-y-1">
          {funnel?.events.map((e) => (
            <li key={e.name}>
              {e.name}: {e.count}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
