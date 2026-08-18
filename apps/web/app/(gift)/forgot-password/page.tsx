'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { GiftAuthShell } from '@/components/auth/auth-visuals';
import { AuthEmailField } from '@/components/auth/auth-fields';
import { apiUrl } from '@/lib/api-base';
import { CSRF_HEADER, CSRF_HEADER_VALUE } from '@/lib/auth-client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch(apiUrl('/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', [CSRF_HEADER]: CSRF_HEADER_VALUE },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        error?: { message?: string };
      };
      if (!res.ok) {
        throw new Error(data.error?.message ?? 'Could not request reset');
      }
      setMsg(data.message ?? 'If an account exists for that email, a reset link will be sent.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <GiftAuthShell
      overline="Soft Gift"
      title="Forgot password"
      description="Enter your email — we send a reset link if the account exists."
      footer={
        <Link href="/login" className="auth-link">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={(e) => void onSubmit(e)} className="auth-form-panel">
        <AuthEmailField
          inputClassName="clay-input"
          labelClassName="text-body"
          value={email}
          onChange={setEmail}
          error={Boolean(error)}
          autoComplete="email"
        />
        {error ? (
          <p className="auth-form-error text-body text-danger" role="alert">
            {error}
          </p>
        ) : null}
        {msg ? (
          <p className="gift-banner gift-banner--success" role="status">
            {msg}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={busy}
          className="clay-btn auth-submit w-full disabled:opacity-60"
        >
          {busy ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
    </GiftAuthShell>
  );
}
