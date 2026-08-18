'use client';

import { CmsMediaField } from '@/components/cms/cms-media-field';
import {
  INSPECTOR_INPUT,
  INSPECTOR_TEXTAREA_SHORT,
  RepeatableAdd,
  RepeatableRow,
} from './page-builder/cms-inspector-ui';

export type FeaturedCarouselCard = {
  id: string;
  category: string;
  kicker: string;
  title: string;
  description?: string;
  imageUrl?: string;
  hoverImageUrl?: string;
  hoverVideoUrl?: string;
  gradient?: string;
  accent?: string;
  href: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
};

function parseCards(raw: string): FeaturedCarouselCard[] {
  try {
    const parsed = JSON.parse(raw || '[]') as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((row): row is Record<string, unknown> => !!row && typeof row === 'object')
      .map((row, i) => ({
        id: String(row.id ?? '').trim() || `card-${i + 1}`,
        category: String(row.category ?? '').trim(),
        kicker: String(row.kicker ?? '').trim(),
        title: String(row.title ?? '').trim(),
        description: String(row.description ?? '').trim(),
        imageUrl: String(row.imageUrl ?? '').trim(),
        hoverImageUrl: String(row.hoverImageUrl ?? '').trim(),
        hoverVideoUrl: String(row.hoverVideoUrl ?? '').trim(),
        gradient: String(row.gradient ?? '').trim(),
        accent: String(row.accent ?? '').trim(),
        href: String(row.href ?? '').trim(),
      }));
  } catch {
    return [];
  }
}

function serializeCards(cards: FeaturedCarouselCard[]): string {
  return JSON.stringify(
    cards.map((c) => ({
      id: c.id,
      category: c.category,
      kicker: c.kicker,
      title: c.title,
      ...(c.description ? { description: c.description } : {}),
      ...(c.imageUrl ? { imageUrl: c.imageUrl } : {}),
      ...(c.hoverImageUrl ? { hoverImageUrl: c.hoverImageUrl } : {}),
      ...(c.hoverVideoUrl ? { hoverVideoUrl: c.hoverVideoUrl } : {}),
      ...(c.gradient ? { gradient: c.gradient } : {}),
      ...(c.accent ? { accent: c.accent } : {}),
      href: c.href,
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

const EMPTY_CARD: FeaturedCarouselCard = {
  id: '',
  category: 'Create',
  kicker: 'New',
  title: 'New card',
  description: '',
  imageUrl: '',
  hoverImageUrl: '',
  href: '/',
};

export function FeaturedCarouselCardsEditor({ value, onChange }: Props) {
  const cards = parseCards(value);

  function setCards(next: FeaturedCarouselCard[]) {
    onChange(serializeCards(next));
  }

  function update(index: number, patch: Partial<FeaturedCarouselCard>) {
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
      {cards.map((card, index) => (
        <RepeatableRow
          key={`${card.id}-${index}`}
          label={card.title || `Card ${index + 1}`}
          onMove={(dir) => move(index, dir)}
          onRemove={() => setCards(cards.filter((_, i) => i !== index))}
        >
          <Field label="Title">
            <input
              className={INSPECTOR_INPUT}
              value={card.title}
              onChange={(e) => update(index, { title: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-1.5">
            <Field label="Category">
              <input
                className={INSPECTOR_INPUT}
                value={card.category}
                onChange={(e) => update(index, { category: e.target.value })}
              />
            </Field>
            <Field label="Kicker">
              <input
                className={INSPECTOR_INPUT}
                value={card.kicker}
                onChange={(e) => update(index, { kicker: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Link">
            <input
              className={INSPECTOR_INPUT}
              value={card.href}
              onChange={(e) => update(index, { href: e.target.value })}
            />
          </Field>
          <Field label="Description">
            <textarea
              className={INSPECTOR_TEXTAREA_SHORT}
              value={card.description ?? ''}
              onChange={(e) => update(index, { description: e.target.value })}
            />
          </Field>
          <Field label="Image">
            <CmsMediaField
              value={card.imageUrl ?? ''}
              onChange={(v) => update(index, { imageUrl: v })}
            />
          </Field>
          <Field label="Hover media">
            <CmsMediaField
              value={card.hoverImageUrl ?? ''}
              onChange={(v) => update(index, { hoverImageUrl: v })}
              allowVideo
            />
          </Field>
        </RepeatableRow>
      ))}
      <RepeatableAdd
        label="Add card"
        disabled={cards.length >= 8}
        onClick={() => setCards([...cards, { ...EMPTY_CARD, id: `card-${cards.length + 1}` }])}
      />
    </div>
  );
}
