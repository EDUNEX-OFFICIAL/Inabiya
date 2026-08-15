'use client';

import { useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { seoSchemaEntrySchema, type SeoSchemaEntry } from '@inabiya/validation';
import { mergeSeoJsonLdWithExtras, type JsonLdNode } from '@/lib/seo-json-ld';
import { OpsIconLink } from '@/components/commerce-ops/ops-icon-action';

type Mode = 'auto' | 'manual';

type Props = {
  value: SeoSchemaEntry[];
  onChange: (next: SeoSchemaEntry[]) => void;
  autoPreviewNodes?: Array<JsonLdNode | null | undefined>;
  publicUrl?: string | null;
  /** Inspector-style chips; skip product-page chrome. */
  embedded?: boolean;
  autoLabel?: string;
  manualLabel?: string;
  emptyPreview?: string;
  radioName?: string;
};

function newId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function findReplace(
  entries: SeoSchemaEntry[],
): Extract<SeoSchemaEntry, { mode: 'replace' }> | null {
  const hit = entries.find((e) => e.mode === 'replace');
  return hit && hit.mode === 'replace' ? hit : null;
}

function docToText(doc: JsonLdNode | null): string {
  return doc ? JSON.stringify(doc, null, 2) : '';
}

/**
 * SEO schema: Auto (system JSON-LD) or Manual (full JSON-LD replace).
 * No “Add extra” presets — keep the admin surface simple.
 */
export function ProductSeoSchemaField({
  value,
  onChange,
  autoPreviewNodes = [],
  publicUrl,
  embedded = false,
  autoLabel = 'Auto from product fields',
  manualLabel = 'Edit JSON yourself',
  emptyPreview = 'Fill title, price, images & FAQs to preview',
  radioName = 'product-schema-mode',
}: Props) {
  const replace = findReplace(value);
  const initialMode: Mode = replace ? 'manual' : 'auto';
  const [mode, setMode] = useState<Mode>(initialMode);
  const [draft, setDraft] = useState(() => (replace ? JSON.stringify(replace.json, null, 2) : ''));
  const [draftError, setDraftError] = useState<string | null>(null);
  const [replaceId] = useState(() => replace?.id ?? newId());

  const extrasForAuto = useMemo(() => value.filter((e) => e.mode !== 'replace'), [value]);
  const autoDoc = useMemo(
    () =>
      mergeSeoJsonLdWithExtras(autoPreviewNodes, extrasForAuto.length ? extrasForAuto : undefined),
    [autoPreviewNodes, extrasForAuto],
  );

  function selectMode(next: Mode) {
    setDraftError(null);
    if (next === 'auto') {
      setMode('auto');
      onChange([]);
      return;
    }
    const seed = docToText(autoDoc);
    setMode('manual');
    setDraft(seed);
    commitManual(seed, replaceId);
  }

  function commitManual(raw: string, id: string) {
    setDraftError(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      setDraftError('Invalid JSON');
      return;
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      setDraftError('JSON must be an object');
      return;
    }
    const entry = {
      id,
      enabled: true,
      mode: 'replace' as const,
      json: parsed as Record<string, unknown>,
    };
    const result = seoSchemaEntrySchema.safeParse(entry);
    if (!result.success) {
      setDraftError(result.error.issues[0]?.message ?? 'Invalid schema');
      return;
    }
    onChange([result.data]);
  }

  const richResultsHref = publicUrl
    ? `https://search.google.com/test/rich-results?url=${encodeURIComponent(publicUrl)}`
    : null;

  const modeToggle = embedded ? (
    <div className="flex items-center justify-between gap-2">
      <div className="flex gap-0.5 rounded-lg bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] p-0.5">
        <button
          type="button"
          className={`rounded-md px-2.5 py-1 text-xs font-medium ${
            mode === 'auto'
              ? 'bg-[var(--foreground)] text-[var(--background)]'
              : 'hover:bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)]'
          }`}
          onClick={() => selectMode('auto')}
        >
          {autoLabel}
        </button>
        <button
          type="button"
          className={`rounded-md px-2.5 py-1 text-xs font-medium ${
            mode === 'manual'
              ? 'bg-[var(--foreground)] text-[var(--background)]'
              : 'hover:bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)]'
          }`}
          onClick={() => selectMode('manual')}
        >
          {manualLabel}
        </button>
      </div>
      {richResultsHref ? (
        <OpsIconLink
          href={richResultsHref}
          label="Test in Google"
          icon={ExternalLink}
          target="_blank"
        />
      ) : null}
    </div>
  ) : (
    <div className="flex flex-wrap gap-4 text-sm">
      <label className="inline-flex items-center gap-2">
        <input
          type="radio"
          name={radioName}
          checked={mode === 'auto'}
          onChange={() => selectMode('auto')}
        />
        {autoLabel}
      </label>
      <label className="inline-flex items-center gap-2">
        <input
          type="radio"
          name={radioName}
          checked={mode === 'manual'}
          onChange={() => selectMode('manual')}
        />
        {manualLabel}
      </label>
    </div>
  );

  const preview = (
    <>
      {mode === 'auto' ? (
        <pre
          className={
            embedded
              ? 'max-h-[22rem] min-h-[14rem] overflow-auto rounded border bg-black/5 p-2 font-mono text-[10px] leading-relaxed'
              : 'max-h-72 overflow-auto rounded border bg-black/5 p-2 font-mono text-[10px] leading-relaxed'
          }
        >
          {autoDoc ? JSON.stringify(autoDoc, null, 2) : emptyPreview}
        </pre>
      ) : (
        <div className="space-y-2">
          {embedded ? null : (
            <p className="text-[11px] opacity-55">
              Advanced — invalid JSON can break Google rich results
            </p>
          )}
          <textarea
            className={
              embedded
                ? 'clay-input mt-0 block !min-h-[18rem] w-full resize-y font-mono text-[10px] leading-relaxed'
                : 'block min-h-[220px] w-full resize-y rounded border px-2 py-1 font-mono text-[10px] leading-relaxed'
            }
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              commitManual(e.target.value, replaceId);
            }}
            spellCheck={false}
            aria-label="Manual JSON-LD schema"
          />
          {draftError ? <p className="text-xs text-red-600">{draftError}</p> : null}
        </div>
      )}
    </>
  );

  if (embedded) {
    return (
      <div className="space-y-2.5">
        {modeToggle}
        {preview}
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-[color:var(--border-subtle)] p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide opacity-70">
            Google schema (JSON-LD)
          </p>
          <p className="mt-0.5 text-[11px] opacity-55">
            Product data for Google — keep Auto unless you need custom JSON
          </p>
        </div>
        {richResultsHref ? (
          <OpsIconLink
            href={richResultsHref}
            label="Test in Google"
            icon={ExternalLink}
            target="_blank"
          />
        ) : null}
      </div>
      {modeToggle}
      {preview}
    </div>
  );
}
