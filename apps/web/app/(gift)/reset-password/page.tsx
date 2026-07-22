'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiUrl } from '@/lib/api-base';

function ResetPasswordForm() {
  const router = useRouter();
  const search = useSearchParams();
  const token = search.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) {
      setError('Missing reset token — open the link from your email.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(apiUrl('/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      if (!res.ok) {
        throw new Error(data.error?.message ?? 'Could not reset password');
      }
      router.replace('/login?reset=1');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center gap-gs-5 px-gs-4 py-gs-7 sm:px-gs-6">
      <div>
        <h1 className="gift-h1">Choose a new password</h1>
        <p className="gift-muted mt-gs-2">Use at least 8 characters.</p>
      </div>
      {!token ? (
        <p className="gift-banner gift-banner--danger">
          Missing or invalid reset link.{' '}
          <Link href="/forgot-password" className="underline">
            Request a new one
          </Link>
          .
        </p>
      ) : (
        <form
          onSubmit={(e) => void onSubmit(e)}
          className="clay-panel flex flex-col gap-gs-4 p-gs-5"
        >
          <label className="flex flex-col gap-gs-1 text-sm">
            New password
            <input
              className="clay-input"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-gs-1 text-sm">
            Confirm password
            <input
              className="clay-input"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </label>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <button type="submit" disabled={busy} className="clay-btn disabled:opacity-60">
            {busy ? 'Saving…' : 'Update password'}
          </button>
        </form>
      )}
      <p className="text-sm opacity-75">
        <Link href="/login" className="font-medium text-primary underline">
          ← Back to sign in
        </Link>
      </p>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="p-gs-6 text-sm opacity-70">Loading…</main>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
