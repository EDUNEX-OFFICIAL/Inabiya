export const HERO_LAYOUTS = [
  'full',
  'fullText',
  'splitMediaCopy',
  'splitCopyMedia',
  'splitMedia',
  'splitCopy',
] as const;

export type HeroLayout = (typeof HERO_LAYOUTS)[number];

export const HERO_LAYOUT_LABELS: Record<HeroLayout, string> = {
  full: 'Full',
  fullText: 'Full text',
  splitMediaCopy: 'Image + text',
  splitCopyMedia: 'Text + image',
  splitMedia: 'Two images',
  splitCopy: 'Two text',
};

export function parseHeroLayout(raw: string | undefined): HeroLayout | undefined {
  if (raw && (HERO_LAYOUTS as readonly string[]).includes(raw)) return raw as HeroLayout;
  return undefined;
}
