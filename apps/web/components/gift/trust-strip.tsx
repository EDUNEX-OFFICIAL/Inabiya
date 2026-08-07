'use client';

import { useEffect, useState } from 'react';
import { apiUrl } from '@/lib/api-base';

export type TrustCueIcon = 'lock' | 'returns' | 'gift';

export type TrustCue = {
  title: string;
  body: string;
  icon: TrustCueIcon;
};

export const DEFAULT_TRUST_CUES: TrustCue[] = [
  {
    title: 'Secure checkout',
    body: 'Encrypted payment — your details stay private.',
    icon: 'lock',
  },
  {
    title: '14-day returns',
    body: 'Easy returns after delivery within the window.',
    icon: 'returns',
  },
  {
    title: 'Gift-box ready',
    body: 'Many pieces are eligible for Build Your Box.',
    icon: 'gift',
  },
];

function CueIcon({ name }: { name: TrustCueIcon }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  if (name === 'lock') {
    return (
      <svg {...common}>
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
    );
  }
  if (name === 'returns') {
    return (
      <svg {...common}>
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <path d="M3 4v5h5" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8" />
      <path d="M12 22V12" />
      <path d="M2 12h20" />
      <path d="M12 12 7.5 7.5a3.5 3.5 0 0 1 5-5L12 3l-.5-.5a3.5 3.5 0 0 1 5 5L12 12" />
    </svg>
  );
}

function normalizeCues(raw: unknown): TrustCue[] {
  if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_TRUST_CUES;
  const icons = new Set<TrustCueIcon>(['lock', 'returns', 'gift']);
  const out: TrustCue[] = [];
  for (const item of raw.slice(0, 6)) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const title = typeof o.title === 'string' ? o.title.trim() : '';
    const body = typeof o.body === 'string' ? o.body.trim() : '';
    const icon = o.icon;
    if (!title || !body || typeof icon !== 'string' || !icons.has(icon as TrustCueIcon)) continue;
    out.push({ title, body, icon: icon as TrustCueIcon });
  }
  return out.length > 0 ? out : DEFAULT_TRUST_CUES;
}

export function TrustStrip({ cues: cuesProp }: { cues?: TrustCue[] }) {
  const [cues, setCues] = useState<TrustCue[]>(cuesProp ?? DEFAULT_TRUST_CUES);

  useEffect(() => {
    if (cuesProp) {
      setCues(cuesProp);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(apiUrl('/commerce/storefront/trust-cues'), {
          credentials: 'omit',
        });
        if (!res.ok) return;
        const data: unknown = await res.json();
        if (!cancelled) setCues(normalizeCues(data));
      } catch {
        /* keep defaults */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cuesProp]);

  return (
    <ul className="grid grid-cols-1 gap-gs-3 sm:grid-cols-3" aria-label="Shopping reassurances">
      {cues.map((c) => (
        <li
          key={c.title}
          className="flex min-w-0 gap-gs-3 rounded-clay border border-border-subtle bg-white/70 px-gs-4 py-gs-3"
        >
          <span className="mt-gs-1 shrink-0 text-primary" aria-hidden>
            <CueIcon name={c.icon} />
          </span>
          <span className="min-w-0">
            <p className="text-body font-medium text-foreground">{c.title}</p>
            <p className="mt-gs-1 text-caption leading-relaxed opacity-70">{c.body}</p>
          </span>
        </li>
      ))}
    </ul>
  );
}
