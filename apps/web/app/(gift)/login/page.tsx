'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { apiAuth, storeSession, type AuthSession } from '@/lib/auth-client';
import { cartApi } from '@/lib/cart-client';

const SEED_USERS = [
  { email: 'customer@test.inabiya', password: 'Password123!', note: 'Customer' },
  { email: 'commerce@test.inabiya', password: 'Password123!', note: 'Commerce admin' },
  { email: 'writer@test.inabiya', password: 'Password123!', note: 'Writer' },
  { email: 'content@test.inabiya', password: 'Password123!', note: 'Content admin' },
  { email: 'finance@test.inabiya', password: 'Password123!', note: 'Finance' },
  { email: 'brand@test.inabiya', password: 'Password123!', note: 'Brand' },
  { email: 'creator@test.inabiya', password: 'Password123!', note: 'Creator' },
] as const;

function safeNextPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return null;
  return raw;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get('next'));
  const resetOk = searchParams.get('reset') === '1';
  const [email, setEmail] = useState('customer@test.inabiya');
  const [password, setPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function redirectAfterLogin(session: AuthSession) {
    if (nextPath) {
      router.push(nextPath);
      return;
    }
    const roles = session.user.roles;
    if (roles.includes('COMMERCE_ADMIN') || roles.includes('SUPER_ADMIN')) {
      router.push('/admin/commerce');
    } else if (roles.includes('BRAND')) {
      router.push('/creator/brand');
    } else if (roles.includes('CREATOR')) {
      router.push('/creator/studio');
    } else if (
      roles.some((r) =>
        ['CONTENT_ADMIN', 'WRITER', 'SEO_EDITOR', 'MEDICAL_REVIEWER', 'FINANCE'].includes(r),
      )
    ) {
      router.push('/admin/editorial');
    } else {
      router.push('/gift');
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const session = await apiAuth<AuthSession>('/auth/login', {
        method: 'POST',
        json: { email: email.trim().toLowerCase(), password },
      });
      storeSession(session);
      try {
        await cartApi('/cart/merge', {
          method: 'POST',
          authToken: session.tokens.accessToken,
        });
      } catch {
        /* guest cart may be empty */
      }
      redirectAfterLogin(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center gap-gs-5 px-gs-4 py-gs-7 sm:px-gs-6">
      <div>
        <h1 className="gift-h1">Sign in</h1>
        <p className="mt-gs-2 text-sm opacity-75">
          {nextPath
            ? `Continue to ${nextPath}`
            : 'Email and password — Soft Gift storefront.'}
        </p>
        {resetOk ? (
          <p className="gift-banner gift-banner--success mt-gs-3" role="status">
            Password updated — sign in with your new password.
          </p>
        ) : null}
      </div>
      <form onSubmit={onSubmit} className="clay-panel flex flex-col gap-gs-3 p-gs-5 sm:p-gs-6">
        <label className="flex flex-col gap-gs-1 text-sm">
          Email
          <input
            className="clay-input !mt-gs-1"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
            spellCheck={false}
          />
        </label>
        <label className="flex flex-col gap-gs-1 text-sm">
          Password
          <div className="relative">
            <input
              className="clay-input !mt-gs-1 pr-gs-7"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
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
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="text-sm opacity-75">
        <Link className="font-medium text-primary underline" href="/forgot-password">
          Forgot password?
        </Link>
      </p>
      <p className="text-sm opacity-75">
        No account?{' '}
        <Link
          className="font-medium text-primary underline"
          href={nextPath ? `/register?next=${encodeURIComponent(nextPath)}` : '/register'}
        >
          Register
        </Link>
      </p>
      <div className="clay-card p-gs-4 text-xs opacity-80">
        <p className="font-medium text-foreground">Seeded test users — click to fill</p>
        <ul className="mt-gs-2 space-y-gs-2">
          {SEED_USERS.map((u) => (
            <li key={u.email}>
              <button
                type="button"
                className="text-left underline decoration-border-strong hover:text-primary"
                onClick={() => {
                  setEmail(u.email);
                  setPassword(u.password);
                  setError(null);
                }}
              >
                {u.email}
              </button>
              <span className="opacity-70"> · {u.note}</span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="p-gs-6 text-sm opacity-70">Loading…</main>}>
      <LoginForm />
    </Suspense>
  );
}
