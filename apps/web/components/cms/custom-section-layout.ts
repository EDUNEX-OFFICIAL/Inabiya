export const CUSTOM_SECTION_LAYOUTS = [
  'stack',
  'split',
  'splitReverse',
  'two',
  'three',
  'bleed',
] as const;

export type CustomSectionLayout = (typeof CUSTOM_SECTION_LAYOUTS)[number];

export const CUSTOM_SECTION_LAYOUT_LABELS: Record<CustomSectionLayout, string> = {
  stack: 'Blank',
  split: 'Text + media',
  splitReverse: 'Media + text',
  two: 'Two columns',
  three: 'Three columns',
  bleed: 'Full bleed',
};

export function parseCustomSectionLayout(raw: string | undefined): CustomSectionLayout | undefined {
  if (raw && (CUSTOM_SECTION_LAYOUTS as readonly string[]).includes(raw)) {
    return raw as CustomSectionLayout;
  }
  return undefined;
}
