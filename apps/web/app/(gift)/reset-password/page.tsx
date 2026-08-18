'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { GiftAuthShell } from '@/components/auth/auth-visuals';
import { AuthPasswordField } from '@/components/auth/auth-fields';
import { apiUrl } from '@/lib/api-base';
import { CSRF_HEADER, CSRF_HEADER_VALUE } from '@/lib/auth-client';

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
        headers: { 'Content-Type': 'application/json', [CSRF_HEADER]: CSRF_HEADER_VALUE },
        credentials: 'include',
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
    <GiftAuthShell
      overline="Soft Gift"
      title="Choose a new password"
      footer={
        <Link href="/login" className="auth-link">
          Back to sign in
        </Link>
      }
    >
      {!token ? (
        <p className="gift-banner gift-banner--danger">
          Missing or invalid reset link.{' '}
          <Link href="/forgot-password" className="auth-link">
            Request a new one
          </Link>
        </p>
      ) : (
        <form onSubmit={(e) => void onSubmit(e)} className="auth-form-panel">
          <AuthPasswordField
            label="New password"
            inputClassName="clay-input"
            labelClassName="text-body"
            value={password}
            onChange={setPassword}
            error={Boolean(error)}
            autoComplete="new-password"
            minLength={8}
          />
          <AuthPasswordField
            label="Confirm password"
            inputClassName="clay-input"
            labelClassName="text-body"
            value={confirm}
            onChange={setConfirm}
            error={Boolean(error)}
            autoComplete="new-password"
            minLength={8}
          />
          {error ? (
            <p className="auth-form-error text-body text-danger" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={busy}
            className="clay-btn auth-submit w-full disabled:opacity-60"
          >
            {busy ? 'Saving…' : 'Update password'}
          </button>
        </form>
      )}
    </GiftAuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="auth-shell auth-shell--gift p-gs-6 text-body opacity-70">Loading…</main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
