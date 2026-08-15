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
    key === 'source' ||
    key === 'hamper' ||
    key === 'showUsps'
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
    key === 'leftImageUrl' ||
    key === 'rightImageUrl' ||
    key === 'alt' ||
    key === 'caption' ||
    key === 'imageAlt' ||
    key === 'leftImageAlt' ||
    key === 'rightImageAlt'
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
