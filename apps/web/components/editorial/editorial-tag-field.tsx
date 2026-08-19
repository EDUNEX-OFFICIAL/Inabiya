'use client';

import { useMemo, useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';

export type EditorialTag = { slug: string; name: string };

const MAX = 12;

type Props = {
  value: EditorialTag[];
  catalog: EditorialTag[];
  onChange: (tags: EditorialTag[]) => void;
  disabled?: boolean;
};

function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

export function EditorialTagField({ value, catalog, onChange, disabled }: Props) {
  const [draft, setDraft] = useState('');
  const selected = useMemo(() => new Set(value.map((t) => t.slug)), [value]);
  const suggestions = useMemo(() => {
    const q = draft.trim().toLowerCase();
    return catalog
      .filter((t) => !selected.has(t.slug) && (!q || t.name.toLowerCase().includes(q) || t.slug.includes(q)))
      .slice(0, 8);
  }, [catalog, draft, selected]);

  function add(raw: string) {
    const slug = slugify(raw);
    if (disabled || slug.length < 2 || selected.has(slug) || value.length >= MAX) return;
    const known = catalog.find((t) => t.slug === slug);
    onChange([...value, { slug, name: known?.name ?? raw.trim().slice(0, 80) }]);
    setDraft('');
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(draft);
    }
    if (e.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="editorial-tag-field">
      <ul className="editorial-tag-field__chips">
        {value.map((t) => (
          <li key={t.slug}>
            <span className="editorial-tag-field__chip">
              {t.name}
              {disabled ? null : (
                <button
                  type="button"
                  className="editorial-tag-field__remove"
                  aria-label={`Remove ${t.name}`}
                  onClick={() => onChange(value.filter((x) => x.slug !== t.slug))}
                >
                  <X className="h-3 w-3" aria-hidden />
                </button>
              )}
            </span>
          </li>
        ))}
        {disabled || value.length >= MAX ? null : (
          <li className="editorial-tag-field__input-wrap">
            <input
              className="editorial-tag-field__input"
              value={draft}
              aria-label="Add a tag"
              placeholder={value.length ? '' : 'Add a tag'}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKey}
              onBlur={() => {
                if (draft.trim()) add(draft);
              }}
            />
          </li>
        )}
      </ul>
      {!disabled && draft.trim() && suggestions.length > 0 ? (
        <ul className="editorial-tag-field__suggest">
          {suggestions.map((t) => (
            <li key={t.slug}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => add(t.name)}>
                {t.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
