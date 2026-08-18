'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { GiftAuthShell } from '@/components/auth/auth-visuals';
import { AuthEmailField, AuthPasswordField, AuthTextField } from '@/components/auth/auth-fields';
import { apiAuth, storeSession, type AuthSession } from '@/lib/auth-client';
import { mergeGuestCommerce } from '@/lib/merge-guest-commerce';
import { safeNextPath } from '@inabiya/validation';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get('next'));
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const session = await apiAuth<AuthSession>('/auth/register', {
        method: 'POST',
        json: {
          email,
          password,
          ...(displayName.trim() ? { displayName: displayName.trim() } : {}),
        },
      });
      storeSession(session);
      await mergeGuestCommerce();
      router.push(nextPath ?? '/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Register failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <GiftAuthShell
      overline="Soft Gift"
      title="Create account"
      description={nextPath ? undefined : 'Save gifts and checkout faster.'}
      footer={
        <p>
          Already have an account?{' '}
          <Link
            className="auth-link"
            href={nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : '/login'}
          >
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={onSubmit} className="auth-form-panel">
        <AuthTextField
          label="Display name"
          inputClassName="clay-input"
          labelClassName="text-body"
          value={displayName}
          onChange={setDisplayName}
          autoComplete="name"
        />
        <AuthEmailField
          inputClassName="clay-input"
          labelClassName="text-body"
          value={email}
          onChange={setEmail}
          error={Boolean(error)}
        />
        <AuthPasswordField
          inputClassName="clay-input"
          labelClassName="text-body"
          value={password}
          onChange={setPassword}
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
          {busy ? 'Creating…' : 'Register'}
        </button>
      </form>
    </GiftAuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <main className="auth-shell auth-shell--gift p-gs-6 text-body opacity-70">Loading…</main>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
