export const SECTION_ALIGN = ['start', 'center', 'end'] as const;
export const SECTION_VALIGN = ['start', 'center', 'end'] as const;
export const SECTION_HEADLINE = ['h2', 'h1', 'display'] as const;
export const SECTION_INK = ['default', 'muted', 'blush'] as const;
export const SECTION_PAD = ['sm', 'md', 'lg'] as const;
export const SECTION_OVERLAY = ['none', 'soft', 'strong'] as const;

export type SectionAlign = (typeof SECTION_ALIGN)[number];
export type SectionValign = (typeof SECTION_VALIGN)[number];
export type SectionHeadline = (typeof SECTION_HEADLINE)[number];
export type SectionInk = (typeof SECTION_INK)[number];
export type SectionPad = (typeof SECTION_PAD)[number];
export type SectionOverlay = (typeof SECTION_OVERLAY)[number];

export type SectionStyle = {
  align?: SectionAlign;
  valign?: SectionValign;
  headlineSize?: SectionHeadline;
  ink?: SectionInk;
  pad?: SectionPad;
  overlay?: SectionOverlay;
};

const STYLE_KEYS = [
  'align',
  'valign',
  'headlineSize',
  'ink',
  'pad',
  'overlay',
] as const satisfies readonly (keyof SectionStyle)[];

function pick<T extends string>(raw: unknown, allowed: readonly T[]): T | undefined {
  return typeof raw === 'string' && (allowed as readonly string[]).includes(raw)
    ? (raw as T)
    : undefined;
}

export function parseSectionStyle(props: Record<string, unknown> | undefined): SectionStyle {
  const p = props ?? {};
  return {
    align: pick(p.align, SECTION_ALIGN),
    valign: pick(p.valign, SECTION_VALIGN),
    headlineSize: pick(p.headlineSize, SECTION_HEADLINE),
    ink: pick(p.ink, SECTION_INK),
    pad: pick(p.pad, SECTION_PAD),
    overlay: pick(p.overlay, SECTION_OVERLAY),
  };
}

export function stylePayload(props: Record<string, string>): Record<string, string> {
  const parsed = parseSectionStyle(props);
  const out: Record<string, string> = {};
  for (const key of STYLE_KEYS) {
    const value = parsed[key];
    if (value) out[key] = value;
  }
  return out;
}

export function attachStyle<T extends { props: Record<string, unknown> }>(
  item: T,
  props: Record<string, string>,
): T {
  const extra = stylePayload(props);
  if (!Object.keys(extra).length) return item;
  return { ...item, props: { ...item.props, ...extra } };
}

export function textAlignClass(align?: SectionAlign): string {
  if (align === 'center') return 'text-center';
  if (align === 'end') return 'text-right';
  if (align === 'start') return 'text-left';
  return '';
}

export function flexJustifyClass(align?: SectionAlign): string {
  if (align === 'center') return 'justify-center';
  if (align === 'end') return 'justify-end';
  if (align === 'start') return 'justify-start';
  return '';
}

export function padClass(pad?: SectionPad): string {
  if (pad === 'sm') return 'py-gs-3';
  if (pad === 'lg') return 'py-gs-8';
  return '';
}

export function inkTextClass(ink?: SectionInk): string {
  if (ink === 'blush') return 'text-[var(--primary)]';
  if (ink === 'muted') return 'gift-muted';
  return '';
}

export function headlineTypeClass(
  size?: SectionHeadline,
  fallback: SectionHeadline = 'h1',
): string {
  const resolved = size ?? fallback;
  if (resolved === 'display') return 'gift-display';
  if (resolved === 'h2') return 'gift-h2';
  return 'gift-h1';
}

export function sectionShellClass(props: Record<string, unknown> | undefined): string {
  const s = parseSectionStyle(props);
  return [textAlignClass(s.align), padClass(s.pad), inkTextClass(s.ink)].filter(Boolean).join(' ');
}

export function overlayWashClass(overlay?: SectionOverlay): string {
  if (overlay === 'none') return 'bg-transparent';
  if (overlay === 'strong') {
    return 'bg-[color-mix(in_srgb,var(--background)_68%,transparent)]';
  }
  return 'bg-[color-mix(in_srgb,var(--background)_42%,transparent)]';
}
