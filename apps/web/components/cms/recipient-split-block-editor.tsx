'use client';

import { CmsMediaField } from '@/components/cms/cms-media-field';
import {
  RECIPIENT_ACCENTS,
  RECIPIENT_GRID_MAX,
  parseRecipientAccent,
  parseRecipientGrid,
  type RecipientAccent,
} from '@/lib/cms-section-layout';
import {
  INSPECTOR_INPUT,
  INSPECTOR_TEXTAREA_SHORT,
  RepeatableAdd,
  RepeatableRow,
} from './page-builder/cms-inspector-ui';

export type RecipientCardDraft = {
  label: string;
  href: string;
  eyebrow: string;
  blurb: string;
  cta: string;
  accent: RecipientAccent;
  imageUrl: string;
  imageAlt: string;
};

const PRESETS: RecipientCardDraft[] = [
  {
    label: 'girl',
    href: '/collections/for-baby-girl',
    eyebrow: 'For the little',
    blurb: 'Blush ribbons, gentle pastels, gender-neutral picks.',
    cta: 'Shop girl gifts →',
    accent: 'pink',
    imageUrl: '/gift/media/baby-girl-soft.jpg',
    imageAlt: 'Baby girl with soft toys',
  },
  {
    label: 'boy',
    href: '/collections/for-baby-boy',
    eyebrow: 'For the little',
    blurb: 'Sky ribbons, soft brights, gender-neutral picks.',
    cta: 'Shop boy gifts →',
    accent: 'sky',
    imageUrl: '/gift/media/train-toy.jpg',
    imageAlt: 'Wooden train set for little boys',
  },
  {
    label: 'mom',
    href: '/collections/for-expecting-mom',
    eyebrow: 'For her too',
    blurb: 'Calm kits and care gifts for expecting and new moms.',
    cta: 'Shop mom gifts →',
    accent: 'lavender',
    imageUrl: '/gift/media/baby-mom.jpg',
    imageAlt: 'Care gifts for new moms',
  },
  {
    label: 'unisex',
    href: '/collections/unisex-gifts',
    eyebrow: 'For any little one',
    blurb: 'Gender-neutral essentials that work for every nursery.',
    cta: 'Shop unisex gifts →',
    accent: 'mint',
    imageUrl: '/gift/media/personalised-name-blanket.webp',
    imageAlt: 'Unisex baby keepsakes',
  },
  {
    label: 'welcome',
    href: '/collections/welcome-baby',
    eyebrow: 'First hello',
    blurb: 'Soft essentials and hampers for the newborn days.',
    cta: 'Shop welcome gifts →',
    accent: 'pink',
    imageUrl: '/gift/media/baby-boy-soft.jpg',
    imageAlt: 'Welcome baby',
  },
  {
    label: 'shower',
    href: '/collections/baby-shower',
    eyebrow: 'Celebrate the bump',
    blurb: 'Ready-to-gift sets and keepsakes for baby showers.',
    cta: 'Shop shower gifts →',
    accent: 'sky',
    imageUrl: '/gift/media/baby-girl-soft.jpg',
    imageAlt: 'Baby shower gifts',
  },
];

function parseCards(raw: string): RecipientCardDraft[] {
  try {
    const parsed = JSON.parse(raw || '[]') as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((row): row is Record<string, unknown> => !!row && typeof row === 'object')
      .map((row, i) => ({
        label: String(row.label ?? '').trim(),
        href: String(row.href ?? '').trim(),
        eyebrow: String(row.eyebrow ?? '').trim(),
        blurb: String(row.blurb ?? '').trim(),
        cta: String(row.cta ?? '').trim(),
        accent: parseRecipientAccent(row.accent, i),
        imageUrl: String(row.imageUrl ?? '').trim(),
        imageAlt: String(row.imageAlt ?? '').trim(),
      }));
  } catch {
    return [];
  }
}

function serializeCards(cards: RecipientCardDraft[]): string {
  return JSON.stringify(
    cards.map((c) => ({
      label: c.label,
      href: c.href,
      ...(c.eyebrow ? { eyebrow: c.eyebrow } : {}),
      ...(c.blurb ? { blurb: c.blurb } : {}),
      ...(c.cta ? { cta: c.cta } : {}),
      accent: c.accent,
      ...(c.imageUrl ? { imageUrl: c.imageUrl } : {}),
      ...(c.imageAlt ? { imageAlt: c.imageAlt } : {}),
    })),
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-0.5 block text-[11px] text-[var(--muted-foreground)]">{label}</span>
      {children}
    </label>
  );
}

function nextPreset(existing: RecipientCardDraft[]): RecipientCardDraft {
  const used = new Set(existing.map((c) => c.href));
  const preset = PRESETS.find((p) => !used.has(p.href));
  return preset ? { ...preset } : { ...PRESETS[0]!, label: 'New', href: '/collections/unisex-gifts' };
}

type Props = {
  value: string;
  onChange: (value: string) => void;
  grid?: string;
};

export function RecipientCardsEditor({ value, onChange, grid }: Props) {
  const cards = parseCards(value);
  const max = RECIPIENT_GRID_MAX[parseRecipientGrid(grid)];
  const shown = Math.min(cards.length, max);

  function setCards(next: RecipientCardDraft[]) {
    onChange(serializeCards(next.slice(0, 6)));
  }

  function update(index: number, patch: Partial<RecipientCardDraft>) {
    setCards(cards.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  }

  function move(index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= cards.length) return;
    const next = [...cards];
    const tmp = next[index]!;
    next[index] = next[j]!;
    next[j] = tmp;
    setCards(next);
  }

  return (
    <div className="space-y-2">
      {cards.length > max ? (
        <p className="text-[11px] text-[var(--muted-foreground)]">
          This layout shows the first {max}. Reorder to pick which.
        </p>
      ) : null}
      {cards.map((card, index) => (
        <RepeatableRow
          key={`${card.href}-${index}`}
          label={`${index < shown ? 'Card' : 'Hidden'} ${index + 1}${card.label ? ` · ${card.label}` : ''}`}
          onMove={(dir) => move(index, dir)}
          onRemove={() => {
            if (cards.length <= 2) return;
            setCards(cards.filter((_, i) => i !== index));
          }}
        >
          <div className="grid grid-cols-2 gap-1.5">
            <Field label="Label">
              <input
                className={INSPECTOR_INPUT}
                value={card.label}
                onChange={(e) => update(index, { label: e.target.value })}
              />
            </Field>
            <Field label="Accent">
              <select
                className={INSPECTOR_INPUT}
                value={card.accent}
                onChange={(e) => update(index, { accent: parseRecipientAccent(e.target.value, index) })}
              >
                {RECIPIENT_ACCENTS.map((accent) => (
                  <option key={accent} value={accent}>
                    {accent}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Link">
            <input
              className={INSPECTOR_INPUT}
              value={card.href}
              onChange={(e) => update(index, { href: e.target.value })}
            />
          </Field>
          <Field label="Eyebrow">
            <input
              className={INSPECTOR_INPUT}
              value={card.eyebrow}
              onChange={(e) => update(index, { eyebrow: e.target.value })}
            />
          </Field>
          <Field label="Blurb">
            <textarea
              className={INSPECTOR_TEXTAREA_SHORT}
              value={card.blurb}
              onChange={(e) => update(index, { blurb: e.target.value })}
            />
          </Field>
          <Field label="Button">
            <input
              className={INSPECTOR_INPUT}
              value={card.cta}
              onChange={(e) => update(index, { cta: e.target.value })}
            />
          </Field>
          <Field label="Image">
            <CmsMediaField
              value={card.imageUrl}
              onChange={(imageUrl) => update(index, { imageUrl })}
            />
          </Field>
        </RepeatableRow>
      ))}
      <RepeatableAdd
        label="Add card"
        disabled={cards.length >= 6}
        onClick={() => setCards([...cards, nextPreset(cards)])}
      />
    </div>
  );
}
