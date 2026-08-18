import type { ReactNode } from 'react';

export function InspectorSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--background)] p-3">
      <h3 className="text-[11px] font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
        {title}
      </h3>
      {children}
    </section>
  );
}

export function InspectorField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="block">
      <p className="mb-1 flex items-baseline justify-between gap-2 text-xs font-medium">
        <span>{label}</span>
        {hint ? (
          <span className="tabular-nums font-normal text-[var(--muted-foreground)]">{hint}</span>
        ) : null}
      </p>
      {children}
    </div>
  );
}

export const INSPECTOR_INPUT = 'clay-input mt-0 block w-full text-sm';

/** Theme `.clay-input` min-height beats plain Tailwind — use `!min-h` on textareas. */
export const INSPECTOR_TEXTAREA = `${INSPECTOR_INPUT} !min-h-[7.5rem] resize-y`;
export const INSPECTOR_TEXTAREA_SHORT = `${INSPECTOR_INPUT} !min-h-[5.5rem] resize-y`;
export const INSPECTOR_TEXTAREA_CODE = `${INSPECTOR_INPUT} !min-h-[10rem] resize-y font-mono text-xs`;

export function inspectorFieldGroup(key: string): 'layout' | 'content' | 'actions' | 'media' {
  if (
    key === 'layout' ||
    key === 'variant' ||
    key === 'bg' ||
    key === 'width' ||
    key === 'minHeight' ||
    key === 'radius' ||
    key === 'size' ||
    key === 'imageFit' ||
    key === 'tone' ||
    key === 'marquee' ||
    key === 'source' ||
    key === 'hamper' ||
    key === 'showUsps' ||
    key === 'grid' ||
    key === 'uspColumns' ||
    key === 'columns' ||
    key === 'display' ||
    key === 'quoteColumns'
  ) {
    return 'layout';
  }
  if (
    key === 'ctaLabel' ||
    key === 'ctaHref' ||
    key === 'ctaLabel2' ||
    key === 'ctaHref2' ||
    key === 'label' ||
    key === 'href' ||
    key === 'seeAllHref' ||
    key === 'seeAllLabel'
  ) {
    return 'actions';
  }
  if (
    key === 'url' ||
    key === 'imageUrl' ||
    key === 'imageUrl2' ||
    key === 'imageUrl3' ||
    key === 'bgImageUrl' ||
    key === 'alt' ||
    key === 'caption' ||
    key === 'imageAlt'
  ) {
    return 'media';
  }
  return 'content';
}

export const INSPECTOR_GROUP_ORDER = ['layout', 'content', 'actions', 'media'] as const;

export const INSPECTOR_GROUP_TITLE: Record<(typeof INSPECTOR_GROUP_ORDER)[number], string> = {
  layout: 'Layout',
  content: 'Content',
  actions: 'Buttons',
  media: 'Media',
};

export function RepeatableRow({
  label,
  onMove,
  onRemove,
  children,
}: {
  label: string;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  children: ReactNode;
}) {
  const btn =
    'inline-flex h-6 w-6 items-center justify-center rounded text-[11px] text-[var(--muted-foreground)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]';
  return (
    <div className="space-y-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] p-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium text-[var(--muted-foreground)]">{label}</p>
        <div className="flex shrink-0">
          <button type="button" className={btn} onClick={() => onMove(-1)} aria-label="Move up">
            ↑
          </button>
          <button type="button" className={btn} onClick={() => onMove(1)} aria-label="Move down">
            ↓
          </button>
          <button type="button" className={btn} onClick={onRemove} aria-label="Remove">
            ×
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}

export function RepeatableAdd({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="w-full rounded-lg border border-dashed border-[var(--border-subtle)] px-2 py-1.5 text-xs font-medium text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--foreground)] disabled:opacity-40"
    >
      {label}
    </button>
  );
}
