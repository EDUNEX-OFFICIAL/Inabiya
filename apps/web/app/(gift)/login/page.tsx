'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { apiAuth, storeSession, type AuthSession } from '@/lib/auth-client';
import { mergeGuestCommerce } from '@/lib/merge-guest-commerce';

/** Seeded demo accounts — shown when NEXT_PUBLIC_SHOW_DEMO_LOGINS=1 or in development. */
const DEMO_PASSWORD = 'Password123!';

const DEMO_USERS = [
  { email: 'customer@test.inabiya', note: 'Customer', href: '/gift' },
  { email: 'commerce@test.inabiya', note: 'Commerce admin', href: '/admin/commerce' },
  { email: 'content@test.inabiya', note: 'Content admin', href: '/admin/cms/pages' },
  { email: 'writer@test.inabiya', note: 'Writer', href: '/admin/editorial' },
  { email: 'seo@test.inabiya', note: 'SEO editor', href: '/admin/editorial' },
  { email: 'medical@test.inabiya', note: 'Medical reviewer', href: '/admin/editorial' },
  { email: 'finance@test.inabiya', note: 'Finance', href: '/admin/editorial' },
  { email: 'support@test.inabiya', note: 'Support', href: '/gift' },
  { email: 'brand@test.inabiya', note: 'Brand', href: '/creator/brand' },
  { email: 'creator@test.inabiya', note: 'Creator', href: '/creator/studio' },
  { email: 'super@test.inabiya', note: 'Super admin', href: '/admin/commerce' },
] as const;

const SHOW_DEMO_LOGINS =
  process.env.NODE_ENV === 'development' ||
  process.env.NEXT_PUBLIC_SHOW_DEMO_LOGINS === '1' ||
  process.env.NEXT_PUBLIC_SHOW_DEMO_LOGINS === 'true';

function safeNextPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return null;
  return raw;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get('next'));
  const resetOk = searchParams.get('reset') === '1';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [filledNote, setFilledNote] = useState<string | null>(null);

  function fillDemo(u: (typeof DEMO_USERS)[number]) {
    setEmail(u.email);
    setPassword(DEMO_PASSWORD);
    setShowPassword(true);
    setError(null);
    setFilledNote(`${u.note} filled — tap Sign in`);
  }

  function redirectAfterLogin(session: AuthSession) {
    if (nextPath) {
      router.push(nextPath);
      return;
    }
    const roles = session.user.roles;
    if (roles.includes('COMMERCE_ADMIN') || roles.includes('SUPER_ADMIN')) {
      router.push('/admin/commerce');
    } else if (roles.includes('SUPPORT')) {
      router.push('/admin/commerce/support');
    } else if (roles.includes('BRAND')) {
      router.push('/creator/brand');
    } else if (roles.includes('CREATOR')) {
      router.push('/creator/studio');
    } else if (
      roles.some((r) =>
        ['CONTENT_ADMIN', 'WRITER', 'SEO_EDITOR', 'MEDICAL_REVIEWER', 'FINANCE'].includes(r),
      )
    ) {
      // Finance: commerce reports if they open ops; editorial remains default for content roles
      if (roles.includes('FINANCE') && !roles.some((r) =>
        ['CONTENT_ADMIN', 'WRITER', 'SEO_EDITOR', 'MEDICAL_REVIEWER'].includes(r),
      )) {
        router.push('/admin/commerce/reports');
      } else {
        router.push('/admin/editorial');
      }
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
      await mergeGuestCommerce(session.tokens.accessToken);
      redirectAfterLogin(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center gap-gs-5 px-gs-4 py-gs-7 sm:px-gs-6">
      <div>
        <h1 className="gift-h1">Sign in</h1>
        {nextPath ? null : (
          <p className="mt-gs-2 text-body opacity-75">
            Sign in to save wishlists, track orders, and checkout faster.
          </p>
        )}
        {resetOk ? (
          <p className="gift-banner gift-banner--success mt-gs-3" role="status">
            Password updated — sign in with your new password.
          </p>
        ) : null}
      </div>
      <form onSubmit={onSubmit} className="clay-panel flex flex-col gap-gs-3 p-gs-5 sm:p-gs-6">
        <label className="flex flex-col gap-gs-1 text-body">
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
        <label className="flex flex-col gap-gs-1 text-body">
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
        {filledNote ? (
          <p className="text-caption font-medium text-primary" role="status">
            {filledNote}
          </p>
        ) : null}
        {error ? <p className="text-body text-danger">{error}</p> : null}
        <button type="submit" disabled={busy} className="clay-btn mt-gs-1 disabled:opacity-60">
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="text-body opacity-75">
        <Link className="font-medium text-primary underline" href="/forgot-password">
          Forgot password?
        </Link>
      </p>
      <p className="text-body opacity-75">
        No account?{' '}
        <Link
          className="font-medium text-primary underline"
          href={nextPath ? `/register?next=${encodeURIComponent(nextPath)}` : '/register'}
        >
          Register
        </Link>
      </p>
      {SHOW_DEMO_LOGINS ? (
        <div className="clay-card space-y-gs-3 p-gs-4" data-testid="demo-login-panel">
          <div>
            <p className="text-body font-semibold text-foreground">Demo accounts — one click fill</p>
            <p className="mt-gs-1 text-caption opacity-70">
              Password for all: <code className="rounded bg-muted px-1 py-gs-1">{DEMO_PASSWORD}</code>
            </p>
          </div>
          <ul className="grid gap-gs-2 sm:grid-cols-2">
            {DEMO_USERS.map((u) => (
              <li key={u.email}>
                <button
                  type="button"
                  className="flex w-full flex-col items-start rounded-control border border-border bg-background px-gs-3 py-gs-2 text-left transition hover:border-primary hover:bg-primary/5"
                  onClick={() => fillDemo(u)}
                  data-testid={`demo-fill-${u.email.split('@')[0]}`}
                >
                  <span className="text-caption font-semibold text-primary">{u.note}</span>
                  <span className="mt-gs-1 truncate font-mono text-[11px] opacity-80">{u.email}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="p-gs-6 text-body opacity-70">Loading…</main>}>
      <LoginForm />
    </Suspense>
  );
}
