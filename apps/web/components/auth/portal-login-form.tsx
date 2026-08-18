'use client';

import { FormEvent, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { apiAuth, clearSession, storeSession, type AuthSession } from '@/lib/auth-client';
import {
  AUTH_PORTALS,
  resolvePortalNext,
  rolesAllowedForPortal,
  type AuthPortalId,
} from '@/lib/auth-portals';
import { mergeGuestCommerce } from '@/lib/merge-guest-commerce';
import { safeNextPath } from '@inabiya/validation';

export type PortalLoginVariant = 'gift' | 'ops' | 'blog' | 'creator';

type Props = {
  portalId: AuthPortalId;
  title: string;
  overline?: string;
  description?: string;
  /** Soft Gift customer / ops / Blog / Creator */
  variant?: PortalLoginVariant;
  /** Decorative left/top panel content */
  visual?: ReactNode;
  footer?: ReactNode;
  /** Extra content between header and form */
  beforeForm?: ReactNode;
};

function recipeClasses(variant: PortalLoginVariant) {
  if (variant === 'blog') {
    return {
      shellMod: 'auth-shell--blog',
      title: 'blog-h1',
      overline: 'blog-overline',
      muted: 'blog-muted',
      panel: 'blog-card auth-form-panel',
      input: 'blog-input',
      btn: 'blog-btn w-full',
      label: 'blog-body',
    };
  }
  if (variant === 'creator') {
    return {
      shellMod: 'auth-shell--creator',
      title: 'creator-h1',
      overline: 'creator-overline',
      muted: 'creator-muted',
      panel: 'creator-card auth-form-panel',
      input: 'creator-input',
      btn: 'creator-btn w-full',
      label: 'creator-body',
    };
  }
  // gift + ops (Soft Gift clay)
  return {
    shellMod: variant === 'ops' ? 'auth-shell--ops' : 'auth-shell--gift',
    title: 'gift-h1',
    overline: 'text-caption font-semibold uppercase tracking-[0.14em] text-primary',
    muted: 'gift-muted',
    panel: 'clay-panel auth-form-panel',
    input: 'clay-input',
    btn: 'clay-btn w-full',
    label: 'text-body',
  };
}

export function PortalLoginForm({
  portalId,
  title,
  overline,
  description,
  variant = 'ops',
  visual,
  footer,
  beforeForm,
}: Props) {
  const portal = AUTH_PORTALS[portalId];
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get('next'));
  const resetOk = searchParams.get('reset') === '1';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const r = recipeClasses(variant);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const session = await apiAuth<AuthSession>('/auth/login', {
        method: 'POST',
        json: { email: email.trim().toLowerCase(), password },
      });
      if (!rolesAllowedForPortal(session.user.roles, portal)) {
        clearSession();
        setError('This account cannot sign in here.');
        return;
      }
      storeSession(session);
      if (portalId === 'customer') {
        await mergeGuestCommerce();
      }
      router.push(resolvePortalNext(portal, nextPath, session.user.roles));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  const errorId = 'portal-login-error';

  return (
    <main
      className={`auth-shell ${r.shellMod}`}
      data-auth-variant={variant}
      data-auth-portal={portalId}
    >
      <div className="auth-shell__grid">
        <aside className="auth-visual" aria-hidden="true">
          {visual}
        </aside>
        <div className="auth-form-col">
          <header className="auth-form-col__header">
            {overline ? <p className={r.overline}>{overline}</p> : null}
            <h1 className={r.title}>{title}</h1>
            {description ? <p className={`${r.muted} mt-2`}>{description}</p> : null}
            {resetOk && portalId === 'customer' ? (
              <p className="gift-banner gift-banner--success mt-gs-3" role="status">
                Password updated — sign in with your new password.
              </p>
            ) : null}
          </header>

          {beforeForm}

          <form
            onSubmit={onSubmit}
            className={`${r.panel} auth-form-panel flex flex-col gap-3`}
            noValidate={false}
          >
            <label className={`flex flex-col gap-1 ${r.label}`}>
              Email
              <input
                className={r.input}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
                spellCheck={false}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
              />
            </label>
            <label className={`flex flex-col gap-1 ${r.label}`}>
              Password
              <div className="relative">
                <input
                  className={`${r.input} auth-password-input`}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? errorId : undefined}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>
            {error ? (
              <p id={errorId} className="text-sm text-danger" role="alert">
                {error}
              </p>
            ) : null}
            <button type="submit" disabled={busy} className={`${r.btn} disabled:opacity-60`}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {footer ? <div className="auth-form-col__footer">{footer}</div> : null}

          {portalId !== 'customer' ? (
            <p className={`text-center text-xs opacity-60 ${r.muted}`}>
              <Link href="/login" className="underline hover:opacity-100">
                Customer sign in
              </Link>
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
