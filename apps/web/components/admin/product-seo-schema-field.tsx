'use client';

import { useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { seoSchemaEntrySchema, type SeoSchemaEntry } from '@inabiya/validation';
import { mergeSeoJsonLd, type JsonLdNode } from '@/lib/seo-json-ld';
import { OpsIconLink } from '@/components/commerce-ops/ops-icon-action';

type Mode = 'auto' | 'manual';

type Props = {
  value: SeoSchemaEntry[];
  onChange: (next: SeoSchemaEntry[]) => void;
  autoPreviewNodes?: Array<JsonLdNode | null | undefined>;
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
 * Product SEO schema: Auto (system Product + FAQ) or Manual (full JSON-LD replace).
 * No “Add extra” presets — keep the admin surface simple.
 */
export function ProductSeoSchemaField({
  value,
  onChange,
  autoPreviewNodes = [],
  publicUrl,
}: Props) {
  const replace = findReplace(value);
  const initialMode: Mode = replace ? 'manual' : 'auto';
  const [mode, setMode] = useState<Mode>(initialMode);
  const [draft, setDraft] = useState(() => (replace ? JSON.stringify(replace.json, null, 2) : ''));
  const [draftError, setDraftError] = useState<string | null>(null);
  const [replaceId] = useState(() => replace?.id ?? newId());

  const autoDoc = useMemo(() => mergeSeoJsonLd(autoPreviewNodes), [autoPreviewNodes]);

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

      <div className="flex flex-wrap gap-4 text-sm">
        <label className="inline-flex items-center gap-2">
          <input
            type="radio"
            name="product-schema-mode"
            checked={mode === 'auto'}
            onChange={() => selectMode('auto')}
          />
          Auto from product fields
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="radio"
            name="product-schema-mode"
            checked={mode === 'manual'}
            onChange={() => selectMode('manual')}
          />
          Edit JSON yourself
        </label>
      </div>

      {mode === 'auto' ? (
        <pre className="max-h-72 overflow-auto rounded border bg-black/5 p-2 font-mono text-[10px] leading-relaxed">
          {autoDoc
            ? JSON.stringify(autoDoc, null, 2)
            : 'Fill title, price, images & FAQs to preview'}
        </pre>
      ) : (
        <div className="space-y-2">
          <p className="text-[11px] opacity-55">
            Advanced — invalid JSON can break Google rich results
          </p>
          <textarea
            className="block w-full min-h-[220px] rounded border px-2 py-1 font-mono text-[10px] leading-relaxed"
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
    </div>
  );
}
