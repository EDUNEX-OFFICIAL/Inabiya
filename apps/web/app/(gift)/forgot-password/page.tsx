'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { apiUrl } from '@/lib/api-base';

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
        headers: { 'Content-Type': 'application/json' },
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
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center gap-gs-5 px-gs-4 py-gs-7 sm:px-gs-6">
      <div>
        <h1 className="gift-h1">Forgot password</h1>
        <p className="gift-muted mt-gs-2">
          Enter your email and we will send a reset link (check worker logs in local/VPS until real
          SMTP is wired).
        </p>
      </div>
      <form onSubmit={(e) => void onSubmit(e)} className="clay-panel flex flex-col gap-gs-4 p-gs-5">
        <label className="flex flex-col gap-gs-1 text-sm">
          Email
          <input
            className="clay-input"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {msg ? (
          <p className="gift-banner gift-banner--success" role="status">
            {msg}
          </p>
        ) : null}
        <button type="submit" disabled={busy} className="clay-btn disabled:opacity-60">
          {busy ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
      <p className="text-sm opacity-75">
        <Link href="/login" className="font-medium text-primary underline">
          ← Back to sign in
        </Link>
      </p>
    </main>
  );
}
