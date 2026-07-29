'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';
import { OpsPageHeader } from '@/components/commerce-ops/ops-page-header';

type Inquiry = {
  id: string;
  type: string;
  fullName: string;
  email: string;
  phone: string | null;
  company: string | null;
  message: string;
  estimatedQty: number | null;
  status: string;
  createdAt: string;
};

export default function AdminGiftingInquiriesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace('/login?next=/admin/commerce/gifting-inquiries');
      return;
    }
    apiAuth<Inquiry[]>('/admin/commerce/gifting-inquiries')
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="max-w-3xl">
      <OpsPageHeader
        title="Gifting inquiries"
        description="Corporate / bulk leads — open customer by email when they have an account."
        actions={
          <>
            <Link href="/admin/commerce/support" className="clay-btn-secondary text-sm">
              Support desk
            </Link>
            <Link href="/admin/commerce/customers" className="clay-btn-secondary text-sm">
              Customers
            </Link>
          </>
        }
      />
      {loading ? <p className="text-sm opacity-70">Loading…</p> : null}
      <ul className="mt-2 space-y-4 text-sm">
        {!loading && rows.length === 0 ? (
          <li className="opacity-70">No inquiries yet.</li>
        ) : (
          rows.map((r) => (
            <li key={r.id} className="rounded border border-[color:var(--gift-line)] p-4">
              <p className="font-medium">
                {r.type} · {r.fullName} · {r.email}
              </p>
              <p className="mt-1 text-xs opacity-70">
                {r.company ?? '—'} · qty {r.estimatedQty ?? '—'} · {r.status} ·{' '}
                {new Date(r.createdAt).toLocaleString('en-IN')}
                {r.phone ? ` · ${r.phone}` : ''}
              </p>
              <p className="mt-2 whitespace-pre-wrap">{r.message}</p>
              <p className="mt-2">
                <Link
                  href={`/admin/commerce/customers?q=${encodeURIComponent(r.email)}`}
                  className="text-xs underline"
                >
                  Find customer
                </Link>
                {' · '}
                <Link href="/admin/commerce/support" className="text-xs underline">
                  Support desk
                </Link>
              </p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
