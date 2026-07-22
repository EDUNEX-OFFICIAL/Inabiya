'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken, type AuthUser } from '@/lib/auth-client';

type Flag = {
  id: string;
  key: string;
  enabled: boolean;
  description: string | null;
};

export default function PlatformFlagsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Flag[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setRows(await apiAuth<Flag[]>('/feature-flags'));
  }, []);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace('/login?next=/admin/platform/flags');
      return;
    }
    apiAuth<AuthUser>('/auth/me')
      .then((u) => {
        if (!u.roles.includes('SUPER_ADMIN')) {
          throw new Error('Super admin required');
        }
        return load();
      })
      .catch((e) => {
        setErr(String(e.message ?? e));
        if (String(e.message ?? e).includes('Super')) {
          router.replace('/login?next=/admin/platform/flags');
        }
      });
  }, [router, load]);

  async function toggle(flag: Flag) {
    setBusy(true);
    setErr(null);
    try {
      await apiAuth(`/feature-flags/${flag.key}`, {
        method: 'PUT',
        json: { enabled: !flag.enabled, description: flag.description },
      });
      await load();
    } catch (e) {
      setErr(String((e as Error).message ?? e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen p-8 bg-[var(--background)] text-[var(--foreground)] max-w-2xl">
      <p className="text-sm opacity-70">
        <Link className="underline" href="/admin/platform">
          Platform
        </Link>{' '}
        / Flags
      </p>
      <h1 className="font-display text-3xl mt-2">Feature flags</h1>
      <p className="mt-2 text-sm opacity-70">SUPER_ADMIN toggles — primitive only.</p>
      {err ? <p className="mt-4 text-sm text-red-600">{err}</p> : null}
      <ul className="mt-6 space-y-3 text-sm">
        {rows.map((flag) => (
          <li key={flag.id} className="border rounded p-3 flex items-start justify-between gap-4">
            <div>
              <p className="font-medium">{flag.key}</p>
              <p className="opacity-70 text-xs mt-1">{flag.description ?? '—'}</p>
            </div>
            <button
              type="button"
              className="underline shrink-0"
              disabled={busy}
              onClick={() => void toggle(flag)}
            >
              {flag.enabled ? 'On' : 'Off'}
            </button>
          </li>
        ))}
        {rows.length === 0 ? <li className="opacity-60">No flags.</li> : null}
      </ul>
    </main>
  );
}
