'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { apiAuth, storeSession, type AuthSession } from '@/lib/auth-client';
import { cartApi } from '@/lib/cart-client';

function safeNextPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return null;
  return raw;
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get('next'));
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      try {
        await cartApi('/cart/merge', {
          method: 'POST',
          authToken: session.tokens.accessToken,
        });
      } catch {
        /* optional */
      }
      router.push(nextPath ?? '/gift');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Register failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center gap-gs-5 px-gs-4 py-gs-7 sm:px-gs-6">
      <div>
        <h1 className="gift-h1">Create account</h1>
        <p className="mt-gs-2 text-sm opacity-75">Registers as customer. Email + password only.</p>
      </div>
      <form onSubmit={onSubmit} className="clay-panel flex flex-col gap-gs-3 p-gs-5 sm:p-gs-6">
        <label className="flex flex-col gap-gs-1 text-sm">
          Display name
          <input
            className="clay-input !mt-gs-1"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoComplete="name"
          />
        </label>
        <label className="flex flex-col gap-gs-1 text-sm">
          Email
          <input
            className="clay-input !mt-gs-1"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
          />
        </label>
        <label className="flex flex-col gap-gs-1 text-sm">
          Password (min 8)
          <div className="relative">
            <input
              className="clay-input !mt-gs-1 pr-gs-7"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-gs-1 opacity-60 hover:opacity-100"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <button type="submit" disabled={busy} className="clay-btn mt-gs-1 disabled:opacity-60">
          {busy ? 'Creating…' : 'Register'}
        </button>
      </form>
      <p className="text-sm opacity-75">
        Already have an account?{' '}
        <Link
          className="font-medium text-primary underline"
          href={nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : '/login'}
        >
          Sign in
        </Link>
      </p>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<main className="p-gs-6 text-sm opacity-70">Loading…</main>}>
      <RegisterForm />
    </Suspense>
  );
}
