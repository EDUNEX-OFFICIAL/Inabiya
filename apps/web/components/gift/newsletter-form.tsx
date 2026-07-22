'use client';

import { FormEvent, useState } from 'react';
import { apiUrl } from '@/lib/api-base';

type Props = {
  compact?: boolean;
};

export function NewsletterForm({ compact = false }: Props) {
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

  return (
    <div className={compact ? '' : 'max-w-lg'}>
      {!compact ? (
        <p className="mb-gs-2 font-semibold text-foreground">Newsletter</p>
      ) : null}
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
