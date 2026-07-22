const CUES = [
  {
    title: 'Secure checkout',
    body: 'Encrypted payment — your details stay private.',
    icon: 'lock' as const,
  },
  {
    title: '14-day returns',
    body: 'Easy returns after delivery within the window.',
    icon: 'returns' as const,
  },
  {
    title: 'Gift-box ready',
    body: 'Many pieces are eligible for Build Your Box.',
    icon: 'gift' as const,
  },
] as const;

function CueIcon({ name }: { name: (typeof CUES)[number]['icon'] }) {
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

export function TrustStrip() {
  return (
    <ul className="grid grid-cols-1 gap-gs-3 sm:grid-cols-3" aria-label="Shopping reassurances">
      {CUES.map((c) => (
        <li
          key={c.title}
          className="flex min-w-0 gap-gs-3 rounded-clay border border-border-subtle bg-white/70 px-gs-4 py-gs-3"
        >
          <span className="mt-0.5 shrink-0 text-primary" aria-hidden>
            <CueIcon name={c.icon} />
          </span>
          <span className="min-w-0">
            <p className="text-sm font-medium text-foreground">{c.title}</p>
            <p className="mt-gs-1 text-xs leading-relaxed opacity-70">{c.body}</p>
          </span>
        </li>
      ))}
    </ul>
  );
}
