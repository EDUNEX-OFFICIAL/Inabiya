'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken, type AuthUser } from '@/lib/auth-client';
import { apiUrl } from '@/lib/api-base';

type Ready = {
  status: string;
  checks: { database: boolean; redis: boolean };
};

type Version = {
  name: string;
  version: string;
  phase: number;
  gitCommit: string | null;
};

export default function PlatformAdminPage() {
  const router = useRouter();
  const [ready, setReady] = useState<Ready | null>(null);
  const [version, setVersion] = useState<Version | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace('/login?next=/admin/platform');
      return;
    }
    apiAuth<AuthUser>('/auth/me')
      .then((u) => {
        if (!u.roles.includes('SUPER_ADMIN') && !u.roles.includes('COMMERCE_ADMIN')) {
          throw new Error('Admin role required');
        }
        return Promise.all([
          fetch(apiUrl('/ready')).then((r) => r.json()),
          fetch(apiUrl('/version')).then((r) => r.json()),
        ]);
      })
      .then(([r, v]) => {
        setReady(r);
        setVersion(v);
      })
      .catch((e) => {
        setErr(String(e.message ?? e));
        if (String(e.message ?? e).includes('Admin')) {
          router.replace('/login?next=/admin/platform');
        }
      });
  }, [router]);

  return (
    <main className="min-h-screen p-8 bg-[var(--background)] text-[var(--foreground)] max-w-2xl">
      <h1 className="font-display text-3xl">Platform Admin</h1>
      <p className="mt-2 text-sm opacity-70">
        Phase 9 ops snapshot — see <code className="text-xs">Docs/RUNBOOKS.md</code>
      </p>
      {err ? <p className="mt-4 text-sm text-red-600">{err}</p> : null}
      <section className="mt-6 rounded border p-4 text-sm space-y-2">
        <h2 className="font-medium">Readiness</h2>
        {ready ? (
          <>
            <p>Status: {ready.status}</p>
            <p>Database: {ready.checks.database ? 'ok' : 'down'}</p>
            <p>Redis: {ready.checks.redis ? 'ok' : 'down'}</p>
          </>
        ) : (
          <p className="opacity-60">Loading…</p>
        )}
      </section>
      <section className="mt-4 rounded border p-4 text-sm space-y-2">
        <h2 className="font-medium">Version</h2>
        {version ? (
          <>
            <p>
              {version.name} {version.version} · phase {version.phase}
            </p>
            <p className="opacity-70">git: {version.gitCommit ?? '—'}</p>
          </>
        ) : (
          <p className="opacity-60">Loading…</p>
        )}
      </section>
      <ul className="mt-6 text-sm space-y-1">
        <li>
          <Link className="underline" href="/admin/commerce">
            Commerce
          </Link>
        </li>
        <li>
          <Link className="underline" href="/admin/editorial">
            Editorial
          </Link>
        </li>
        <li>
          <Link className="underline" href="/creator">
            Creator Collective
          </Link>
        </li>
      </ul>
    </main>
  );
}
