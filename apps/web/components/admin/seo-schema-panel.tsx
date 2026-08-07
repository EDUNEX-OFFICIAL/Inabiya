'use client';

import { useMemo, useState } from 'react';
import {
  SEO_SCHEMA_PRESETS,
  seoSchemaEntrySchema,
  seoSchemaExtrasSchema,
  type SeoSchemaEntry,
  type SeoSchemaPreset,
} from '@inabiya/validation';
import {
  compileExtrasToNodes,
  emptyPresetFields,
  mergeSeoJsonLdWithExtras,
  type JsonLdNode,
} from '@/lib/seo-json-ld';

type Props = {
  value: SeoSchemaEntry[];
  onChange: (next: SeoSchemaEntry[]) => void;
  /** System nodes for Preview (auto Product/Article/WebPage/FAQ). */
  autoPreviewNodes?: Array<JsonLdNode | null | undefined>;
  /** Labels for auto-generated types shown in the summary (e.g. Product, FAQ). */
  autoTypes?: string[];
  /** Hide FAQPage preset when system FAQ already emits FAQPage. */
  hasSystemFaq?: boolean;
  /** Public URL for Rich Results Test link (when known). */
  publicUrl?: string | null;
};

function newId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function entryLabel(entry: SeoSchemaEntry): string {
  if (entry.mode === 'preset') return entry.preset;
  const t = entry.json['@type'];
  if (typeof t === 'string') return t;
  if (Array.isArray(t) && typeof t[0] === 'string') return t[0];
  return 'Custom';
}

/**
 * Auto-first schema UX: show what the page already emits; extras + JSON stay behind expanders.
 */
export function SeoSchemaPanel({
  value,
  onChange,
  autoPreviewNodes = [],
  autoTypes = [],
  hasSystemFaq = false,
  publicUrl,
}: Props) {
  const [extrasOpen, setExtrasOpen] = useState(value.length > 0);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [customDraft, setCustomDraft] = useState('{\n  "@type": "Organization",\n  "name": ""\n}');
  const [customError, setCustomError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const presets = useMemo(
    () => SEO_SCHEMA_PRESETS.filter((p) => !(hasSystemFaq && p === 'FAQPage')),
    [hasSystemFaq],
  );

  const previewDoc = useMemo(
    () => mergeSeoJsonLdWithExtras(autoPreviewNodes, value),
    [autoPreviewNodes, value],
  );

  const editing = value.find((e) => e.id === editingId) ?? null;

  function addPreset(preset: SeoSchemaPreset) {
    const entry: SeoSchemaEntry = {
      id: newId(),
      enabled: true,
      mode: 'preset',
      preset,
      fields: emptyPresetFields(preset),
    } as SeoSchemaEntry;
    const parsed = seoSchemaEntrySchema.safeParse(entry);
    const next = [
      ...value,
      parsed.success
        ? parsed.data
        : ({
            id: entry.id,
            enabled: true,
            mode: 'preset' as const,
            preset,
            fields: emptyPresetFields(preset),
          } as SeoSchemaEntry),
    ];
    onChange(next);
    setEditingId(entry.id);
    setExtrasOpen(true);
  }

  function addCustom() {
    setCustomError(null);
    let parsedJson: Record<string, unknown>;
    try {
      const raw = JSON.parse(customDraft) as unknown;
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        setCustomError('JSON must be an object');
        return;
      }
      parsedJson = raw as Record<string, unknown>;
    } catch {
      setCustomError('Invalid JSON');
      return;
    }
    const entry = {
      id: newId(),
      enabled: true,
      mode: 'custom' as const,
      json: parsedJson,
    };
    const result = seoSchemaEntrySchema.safeParse(entry);
    if (!result.success) {
      setCustomError(result.error.issues[0]?.message ?? 'Invalid schema');
      return;
    }
    const check = seoSchemaExtrasSchema.safeParse([...value, result.data]);
    if (!check.success) {
      setCustomError(check.error.issues[0]?.message ?? 'Invalid schema');
      return;
    }
    if (hasSystemFaq) {
      const types = compileExtrasToNodes([result.data]).flatMap((n) => {
        const t = n['@type'];
        return typeof t === 'string'
          ? [t]
          : Array.isArray(t)
            ? t.filter((x): x is string => typeof x === 'string')
            : [];
      });
      if (types.includes('FAQPage')) {
        setCustomError('FAQ schema is already generated from page FAQs');
        return;
      }
    }
    onChange([...value, result.data]);
    setEditingId(result.data.id);
    setAdvancedOpen(false);
    setExtrasOpen(true);
  }

  function updateEntry(id: string, patch: Partial<SeoSchemaEntry>) {
    onChange(
      value.map((e) => {
        if (e.id !== id) return e;
        return { ...e, ...patch } as SeoSchemaEntry;
      }),
    );
  }

  function removeEntry(id: string) {
    onChange(value.filter((e) => e.id !== id));
    if (editingId === id) setEditingId(null);
  }

  const richResultsHref = publicUrl
    ? `https://search.google.com/test/rich-results?url=${encodeURIComponent(publicUrl)}`
    : null;

  return (
    <div className="space-y-3 rounded-lg border border-[color:var(--border-subtle)] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide opacity-70">Schema</p>
        {richResultsHref ? (
          <a
            href={richResultsHref}
            target="_blank"
            rel="noreferrer"
            className="text-xs underline opacity-70"
          >
            Rich Results Test
          </a>
        ) : null}
      </div>

      {autoTypes.length > 0 ? (
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] opacity-50">Generated</span>
            {autoTypes.map((t) => (
              <span
                key={t}
                className="rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--surface-soft)] px-2 py-0.5 text-[11px] font-medium"
              >
                {t}
              </span>
            ))}
          </div>
          <p className="text-[11px] leading-snug opacity-60">
            Built from this page’s fields (title, price, media, FAQs). Change those sections to
            update — or add extras below.
          </p>
        </div>
      ) : (
        <p className="text-[11px] opacity-50">Schema from page content</p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded border px-2 py-1 text-xs"
          onClick={() => setPreviewOpen((o) => !o)}
        >
          {previewOpen ? 'Hide JSON-LD' : 'Review JSON-LD'}
        </button>
        <button
          type="button"
          className="rounded border px-2 py-1 text-xs"
          onClick={() => setExtrasOpen((o) => !o)}
        >
          {extrasOpen ? 'Hide extras' : value.length ? `Extras (${value.length})` : 'Add extra'}
        </button>
        <button
          type="button"
          className="rounded border px-2 py-1 text-xs opacity-70"
          onClick={() => {
            setExtrasOpen(true);
            setAdvancedOpen((o) => !o);
          }}
        >
          Advanced JSON
        </button>
      </div>

      {previewOpen ? (
        <pre className="max-h-72 overflow-auto rounded border bg-black/5 p-2 font-mono text-[10px] leading-relaxed">
          {previewDoc ? JSON.stringify(previewDoc, null, 2) : 'Save product fields to preview schema'}
        </pre>
      ) : null}

      {extrasOpen ? (
        <div className="space-y-2 border-t border-[color:var(--border-subtle)] pt-2">
          {value.length === 0 ? (
            <p className="text-xs opacity-50">No extras yet</p>
          ) : (
            <ul className="space-y-2">
              {value.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-center gap-2 rounded border border-[color:var(--border-subtle)] px-2 py-1.5 text-sm"
                >
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={entry.enabled}
                      onChange={(e) => updateEntry(entry.id, { enabled: e.target.checked })}
                    />
                    <span className="font-mono text-xs">{entryLabel(entry)}</span>
                  </label>
                  <button
                    type="button"
                    className="text-xs underline opacity-70"
                    onClick={() => setEditingId(entry.id === editingId ? null : entry.id)}
                  >
                    {editingId === entry.id ? 'Close' : 'Edit'}
                  </button>
                  <button
                    type="button"
                    className="ml-auto text-xs text-red-700 underline"
                    onClick={() => removeEntry(entry.id)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          <label className="block text-xs">
            <span className="sr-only">Add schema</span>
            <select
              className="rounded border px-2 py-1 text-xs"
              defaultValue=""
              onChange={(e) => {
                const v = e.target.value as SeoSchemaPreset | '';
                e.target.value = '';
                if (v) addPreset(v);
              }}
            >
              <option value="">Add type…</option>
              {presets.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          {advancedOpen ? (
            <div className="space-y-2">
              <textarea
                className="block w-full rounded border px-2 py-1 font-mono text-xs min-h-[120px]"
                value={customDraft}
                onChange={(e) => setCustomDraft(e.target.value)}
                spellCheck={false}
              />
              {customError ? <p className="text-xs text-red-600">{customError}</p> : null}
              <button type="button" className="rounded border px-2 py-1 text-xs" onClick={addCustom}>
                Validate & add
              </button>
            </div>
          ) : null}

          {editing && editing.mode === 'preset' ? (
            <PresetFieldsEditor
              entry={editing}
              onChange={(fields) => updateEntry(editing.id, { fields } as Partial<SeoSchemaEntry>)}
            />
          ) : null}

          {editing && editing.mode === 'custom' ? (
            <div className="space-y-2">
              <textarea
                className="block w-full rounded border px-2 py-1 font-mono text-xs min-h-[120px]"
                value={JSON.stringify(editing.json, null, 2)}
                onChange={(e) => {
                  try {
                    const raw = JSON.parse(e.target.value) as unknown;
                    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
                      updateEntry(editing.id, {
                        json: raw as Record<string, unknown>,
                      } as Partial<SeoSchemaEntry>);
                    }
                  } catch {
                    /* keep typing */
                  }
                }}
                spellCheck={false}
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function PresetFieldsEditor({
  entry,
  onChange,
}: {
  entry: Extract<SeoSchemaEntry, { mode: 'preset' }>;
  onChange: (fields: Record<string, unknown>) => void;
}) {
  const fields = entry.fields as Record<string, unknown>;

  if (entry.preset === 'HowTo') {
    const steps = Array.isArray(fields.steps)
      ? (fields.steps as Array<{ name: string; text: string }>)
      : [];
    return (
      <div className="space-y-2 border-t pt-2 text-sm">
        <label className="block text-xs">
          Name
          <input
            className="mt-1 block w-full rounded border px-2 py-1"
            value={String(fields.name ?? '')}
            onChange={(e) => onChange({ ...fields, name: e.target.value })}
          />
        </label>
        <label className="block text-xs">
          Description
          <input
            className="mt-1 block w-full rounded border px-2 py-1"
            value={String(fields.description ?? '')}
            onChange={(e) => onChange({ ...fields, description: e.target.value })}
            placeholder="Optional"
          />
        </label>
        {steps.map((step, i) => (
          <div key={i} className="space-y-1 rounded border p-2">
            <input
              className="block w-full rounded border px-2 py-1 text-xs"
              placeholder="Step name"
              value={step.name}
              onChange={(e) => {
                const next = steps.map((s, j) => (j === i ? { ...s, name: e.target.value } : s));
                onChange({ ...fields, steps: next });
              }}
            />
            <textarea
              className="block w-full rounded border px-2 py-1 text-xs min-h-[48px]"
              placeholder="Step text"
              value={step.text}
              onChange={(e) => {
                const next = steps.map((s, j) => (j === i ? { ...s, text: e.target.value } : s));
                onChange({ ...fields, steps: next });
              }}
            />
          </div>
        ))}
        <button
          type="button"
          className="text-xs underline"
          onClick={() => onChange({ ...fields, steps: [...steps, { name: '', text: '' }] })}
        >
          Add step
        </button>
      </div>
    );
  }

  if (entry.preset === 'Organization') {
    return (
      <div className="space-y-2 border-t pt-2 text-sm">
        {(['name', 'url', 'logoUrl', 'description'] as const).map((key) => (
          <label key={key} className="block text-xs">
            {key}
            <input
              className="mt-1 block w-full rounded border px-2 py-1"
              value={String(fields[key] ?? '')}
              onChange={(e) => onChange({ ...fields, [key]: e.target.value })}
            />
          </label>
        ))}
      </div>
    );
  }

  if (entry.preset === 'Person') {
    return (
      <div className="space-y-2 border-t pt-2 text-sm">
        {(['name', 'jobTitle', 'url', 'imageUrl'] as const).map((key) => (
          <label key={key} className="block text-xs">
            {key}
            <input
              className="mt-1 block w-full rounded border px-2 py-1"
              value={String(fields[key] ?? '')}
              onChange={(e) => onChange({ ...fields, [key]: e.target.value })}
            />
          </label>
        ))}
      </div>
    );
  }

  if (entry.preset === 'ImageObject') {
    return (
      <div className="space-y-2 border-t pt-2 text-sm">
        <label className="block text-xs">
          url
          <input
            className="mt-1 block w-full rounded border px-2 py-1"
            value={String(fields.url ?? '')}
            onChange={(e) => onChange({ ...fields, url: e.target.value })}
          />
        </label>
        <label className="block text-xs">
          caption
          <input
            className="mt-1 block w-full rounded border px-2 py-1"
            value={String(fields.caption ?? '')}
            onChange={(e) => onChange({ ...fields, caption: e.target.value })}
          />
        </label>
      </div>
    );
  }

  if (entry.preset === 'BreadcrumbList' || entry.preset === 'ItemList' || entry.preset === 'FAQPage') {
    const items = Array.isArray(fields.items)
      ? (fields.items as Array<Record<string, string>>)
      : [];
    return (
      <div className="space-y-2 border-t pt-2 text-sm">
        {entry.preset === 'ItemList' ? (
          <label className="block text-xs">
            name
            <input
              className="mt-1 block w-full rounded border px-2 py-1"
              value={String(fields.name ?? '')}
              onChange={(e) => onChange({ ...fields, name: e.target.value })}
              placeholder="Optional"
            />
          </label>
        ) : null}
        {items.map((item, i) => (
          <div key={i} className="space-y-1 rounded border p-2">
            {entry.preset === 'FAQPage' ? (
              <>
                <input
                  className="block w-full rounded border px-2 py-1 text-xs"
                  placeholder="Question"
                  value={item.question ?? ''}
                  onChange={(e) => {
                    const next = items.map((row, j) =>
                      j === i ? { ...row, question: e.target.value } : row,
                    );
                    onChange({ ...fields, items: next });
                  }}
                />
                <textarea
                  className="block w-full rounded border px-2 py-1 text-xs min-h-[48px]"
                  placeholder="Answer"
                  value={item.answerText ?? ''}
                  onChange={(e) => {
                    const next = items.map((row, j) =>
                      j === i ? { ...row, answerText: e.target.value } : row,
                    );
                    onChange({ ...fields, items: next });
                  }}
                />
              </>
            ) : (
              <>
                <input
                  className="block w-full rounded border px-2 py-1 text-xs"
                  placeholder="Name"
                  value={item.name ?? ''}
                  onChange={(e) => {
                    const next = items.map((row, j) =>
                      j === i ? { ...row, name: e.target.value } : row,
                    );
                    onChange({ ...fields, items: next });
                  }}
                />
                <input
                  className="block w-full rounded border px-2 py-1 text-xs"
                  placeholder="URL"
                  value={item.url ?? ''}
                  onChange={(e) => {
                    const next = items.map((row, j) =>
                      j === i ? { ...row, url: e.target.value } : row,
                    );
                    onChange({ ...fields, items: next });
                  }}
                />
              </>
            )}
          </div>
        ))}
        <button
          type="button"
          className="text-xs underline"
          onClick={() => {
            const blank =
              entry.preset === 'FAQPage'
                ? { question: '', answerText: '' }
                : { name: '', url: '' };
            onChange({ ...fields, items: [...items, blank] });
          }}
        >
          Add item
        </button>
      </div>
    );
  }

  return null;
}
