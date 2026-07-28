'use client';

import { FormEvent, useState } from 'react';
import { apiUrl } from '@/lib/api-base';

type Props = {
  /** Shorter layout (footer / mid-page panels). */
  compact?: boolean;
  /** Hide the default “Newsletter” heading (when parent already has a title). */
  hideTitle?: boolean;
};

export function NewsletterForm({ compact = false, hideTitle = false }: Props) {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(apiUrl('/articles/newsletter'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error('Could not subscribe');
      setMsg('Thanks — you are on the list.');
      setEmail('');
    } catch {
      setMsg('Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  }

  if (compact) {
    return (
      <div className="gift-newsletter">
        {!hideTitle ? (
          <>
            <p className="gift-newsletter__title">Stay in the loop</p>
            <p className="gift-newsletter__hint">New drops & gentle parenting notes — no spam.</p>
          </>
        ) : null}
        <form
          onSubmit={(e) => void onSubmit(e)}
          className={`gift-newsletter__form${hideTitle ? ' gift-newsletter__form--flush' : ''}`}
        >
          <input
            type="email"
            required
            placeholder="you@email.com"
            className="gift-newsletter__input block w-full min-h-[calc(var(--tap-min)-4px)] rounded-[var(--radius-control)] border border-[var(--input-border)] bg-[var(--input-bg)] px-gs-3 py-gs-2 text-sm text-foreground shadow-[var(--input-shadow)]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Email for newsletter"
          />
          <button
            type="submit"
            disabled={busy}
            className="gift-newsletter__btn inline-flex min-h-tap items-center justify-center rounded-[var(--radius-control)] bg-primary px-gs-4 py-gs-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            data-testid="newsletter-subscribe-btn"
          >
            {busy ? '…' : 'Subscribe'}
          </button>
        </form>
        {msg ? <p className="gift-newsletter__msg">{msg}</p> : null}
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      {!hideTitle ? <p className="mb-gs-2 font-semibold">Newsletter</p> : null}
      <form
        onSubmit={(e) => void onSubmit(e)}
        className="flex w-full flex-col gap-gs-2 sm:flex-row sm:flex-wrap"
      >
        <input
          type="email"
          required
          placeholder="you@email.com"
          className="clay-input !mt-0 flex-1"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Email for newsletter"
        />
        <button type="submit" disabled={busy} className="clay-btn disabled:opacity-50">
          {busy ? '…' : 'Subscribe'}
        </button>
        {msg ? <p className="w-full text-sm opacity-80 sm:basis-full">{msg}</p> : null}
      </form>
    </div>
  );
}
