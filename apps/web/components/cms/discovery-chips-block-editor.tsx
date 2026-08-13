'use client';

import { CmsMediaField } from '@/components/cms/cms-media-field';

export type DiscoveryChipCard = {
  label: string;
  href: string;
  imageUrl?: string;
  imageAlt?: string;
};

type Props = {
  props: Record<string, string>;
  onChange: (key: string, value: string) => void;
};

const OCCASION_PRESET: DiscoveryChipCard[] = [
  {
    label: 'Welcome baby',
    href: '/gift/collections/welcome-baby',
    imageUrl: '/gift/media/baby-boy-soft.jpg',
    imageAlt: 'Newborn welcome',
  },
  {
    label: 'Baby shower',
    href: '/gift/collections/baby-shower',
    imageUrl: '/gift/media/baby-girl-soft.jpg',
    imageAlt: 'Baby shower gifts',
  },
  {
    label: 'Naming',
    href: '/gift/collections/naming-ceremony',
    imageUrl: '/gift/media/personalised-name-blanket.webp',
    imageAlt: 'Naming ceremony',
  },
  {
    label: 'Birthday',
    href: '/gift/collections/first-birthday',
    imageUrl: '/gift/media/train-toy.jpg',
    imageAlt: 'Birthday toys',
  },
];

const AGE_PRESET: DiscoveryChipCard[] = [
  {
    label: 'Newborn',
    href: '/gift/collections/newborn',
    imageUrl: '/gift/media/baby-boy-soft.jpg',
    imageAlt: 'Newborn essentials',
  },
  {
    label: 'Infant',
    href: '/gift/collections/infant',
    imageUrl: '/gift/media/baby-girl-soft.jpg',
    imageAlt: 'Infant gifts',
  },
  {
    label: 'Toddler',
    href: '/gift/collections/toddler',
    imageUrl: '/gift/media/train-toy.jpg',
    imageAlt: 'Toddler play',
  },
];

function parseItems(raw: string): DiscoveryChipCard[] {
  return (raw || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split('|').map((p) => p.trim());
      const card: DiscoveryChipCard = {
        label: parts[0] || '',
        href: parts[1] || '',
      };
      if (parts[2]) card.imageUrl = parts[2];
      if (parts[3]) card.imageAlt = parts[3];
      return card;
    })
    .filter((c) => c.label && c.href);
}

function serializeItems(items: DiscoveryChipCard[]): string {
  return items
    .map((c) => {
      if (c.imageUrl) {
        return c.imageAlt
          ? `${c.label} | ${c.href} | ${c.imageUrl} | ${c.imageAlt}`
          : `${c.label} | ${c.href} | ${c.imageUrl}`;
      }
      return `${c.label} | ${c.href}`;
    })
    .join('\n');
}

export function DiscoveryChipsBlockEditor({ props, onChange }: Props) {
  const items = parseItems(props.items ?? '');

  function setItems(next: DiscoveryChipCard[]) {
    onChange('items', serializeItems(next));
  }

  function updateCard(index: number, patch: Partial<DiscoveryChipCard>) {
    setItems(items.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  }

  function removeCard(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function addCard() {
    setItems([...items, { label: 'New tile', href: '/gift/products', imageUrl: '', imageAlt: '' }]);
  }

  function moveCard(index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    const tmp = next[index]!;
    next[index] = next[j]!;
    next[j] = tmp;
    setItems(next);
  }

  return (
    <div className="space-y-3">
      <label className="block">
        Overline
        <input
          className="mt-1 block w-full rounded border px-2 py-1"
          value={props.overline ?? ''}
          onChange={(e) => onChange('overline', e.target.value)}
        />
      </label>
      <label className="block">
        Title
        <input
          className="mt-1 block w-full rounded border px-2 py-1"
          value={props.title ?? ''}
          onChange={(e) => onChange('title', e.target.value)}
        />
      </label>
      <label className="block">
        Subtitle
        <input
          className="mt-1 block w-full rounded border px-2 py-1"
          value={props.subtitle ?? ''}
          onChange={(e) => onChange('subtitle', e.target.value)}
        />
      </label>
      <label className="block">
        See all href
        <input
          className="mt-1 block w-full rounded border px-2 py-1 font-mono text-xs"
          value={props.seeAllHref ?? ''}
          onChange={(e) => onChange('seeAllHref', e.target.value)}
        />
      </label>
      <label className="block">
        See all label
        <input
          className="mt-1 block w-full rounded border px-2 py-1"
          value={props.seeAllLabel ?? ''}
          onChange={(e) => onChange('seeAllLabel', e.target.value)}
        />
      </label>
      <label className="block">
        Preview limit (cards on page)
        <input
          type="number"
          min={1}
          max={12}
          className="mt-1 block w-full rounded border px-2 py-1"
          value={props.limit ?? '4'}
          onChange={(e) => onChange('limit', e.target.value)}
        />
      </label>

      <label className="block">
        Items source
        <select
          className="mt-1 block w-full rounded border px-2 py-1"
          value={props.itemsSource === 'catalogCollections' ? 'catalogCollections' : 'manual'}
          onChange={(e) => onChange('itemsSource', e.target.value)}
        >
          <option value="manual">Manual chips</option>
          <option value="catalogCollections">Catalog collections (live)</option>
        </select>
      </label>

      {props.itemsSource === 'catalogCollections' ? (
        <p className="text-xs opacity-60">
          Chips load from catalog. Optional rows below supply images per category slug.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded border px-2 py-1 text-xs"
          onClick={() => {
            onChange('title', 'Shop by occasion');
            onChange('itemsSource', 'manual');
            onChange('seeAllHref', '/gift/products');
            setItems(OCCASION_PRESET);
          }}
        >
          Preset: occasions
        </button>
        <button
          type="button"
          className="rounded border px-2 py-1 text-xs"
          onClick={() => {
            onChange('title', 'Shop by age');
            onChange('itemsSource', 'manual');
            onChange('seeAllHref', '/gift/products');
            setItems(AGE_PRESET);
          }}
        >
          Preset: ages
        </button>
        <button
          type="button"
          className="rounded border px-2 py-1 text-xs"
          onClick={() => {
            onChange('title', 'Shop by category');
            onChange('itemsSource', 'catalogCollections');
            onChange('seeAllHref', '/gift/products');
          }}
        >
          Preset: catalog collections
        </button>
        <button type="button" className="rounded border px-2 py-1 text-xs" onClick={addCard}>
          + Add tile
        </button>
      </div>

      <ul className="space-y-3">
        {items.map((card, index) => (
          <li key={`${card.href}-${index}`} className="rounded border p-2 space-y-2 bg-neutral-50">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium opacity-70">Tile {index + 1}</span>
              <div className="flex gap-1">
                <button type="button" className="px-1 text-xs" onClick={() => moveCard(index, -1)}>
                  ↑
                </button>
                <button type="button" className="px-1 text-xs" onClick={() => moveCard(index, 1)}>
                  ↓
                </button>
                <button
                  type="button"
                  className="px-1 text-xs text-red-600"
                  onClick={() => removeCard(index)}
                >
                  Remove
                </button>
              </div>
            </div>
            <label className="block text-xs">
              Label
              <input
                className="mt-1 block w-full rounded border px-2 py-1"
                value={card.label}
                onChange={(e) => updateCard(index, { label: e.target.value })}
              />
            </label>
            <label className="block text-xs">
              Href
              <input
                className="mt-1 block w-full rounded border px-2 py-1 font-mono"
                value={card.href}
                onChange={(e) => updateCard(index, { href: e.target.value })}
              />
            </label>
            <div className="text-xs">
              <span className="opacity-70">Image</span>
              <CmsMediaField
                value={card.imageUrl ?? ''}
                onChange={(v) => updateCard(index, { imageUrl: v })}
              />
            </div>
            <label className="block text-xs">
              Image alt
              <input
                className="mt-1 block w-full rounded border px-2 py-1"
                value={card.imageAlt ?? ''}
                onChange={(e) => updateCard(index, { imageAlt: e.target.value })}
              />
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
