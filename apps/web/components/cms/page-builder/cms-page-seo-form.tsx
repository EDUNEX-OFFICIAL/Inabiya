'use client';

import { CmsMediaField } from '@/components/cms/cms-media-field';
import { ProductSeoSchemaField } from '@/components/admin/product-seo-schema-field';
import type { SeoSchemaEntry } from '@inabiya/validation';
import type { JsonLdNode } from '@/lib/seo-json-ld';
import {
  INSPECTOR_INPUT,
  INSPECTOR_TEXTAREA,
  InspectorField,
  InspectorSection,
} from './cms-inspector-ui';

type Props = {
  title: string;
  seoTitle: string;
  seoDescription: string;
  canonicalPath: string;
  ogImageUrl: string;
  robotsIndex: boolean;
  seoSchemaExtras: SeoSchemaEntry[];
  autoPreviewNodes: Array<JsonLdNode | null | undefined>;
  publicUrl: string | null;
  onTitle: (v: string) => void;
  onSeoTitle: (v: string) => void;
  onSeoDescription: (v: string) => void;
  onCanonicalPath: (v: string) => void;
  onOgImageUrl: (v: string) => void;
  onRobotsIndex: (v: boolean) => void;
  onSeoSchemaExtras: (v: SeoSchemaEntry[]) => void;
};

function Count({ n, max }: { n: number; max: number }) {
  return (
    <span className={n > max ? 'text-amber-800' : undefined}>
      {n}/{max}
    </span>
  );
}

export function CmsPageSeoForm({
  title,
  seoTitle,
  seoDescription,
  canonicalPath,
  ogImageUrl,
  robotsIndex,
  seoSchemaExtras,
  autoPreviewNodes,
  publicUrl,
  onTitle,
  onSeoTitle,
  onSeoDescription,
  onCanonicalPath,
  onOgImageUrl,
  onRobotsIndex,
  onSeoSchemaExtras,
}: Props) {
  return (
    <div className="space-y-3 text-sm">
      <InspectorSection title="Page">
        <InspectorField label="Title">
          <input
            className={INSPECTOR_INPUT}
            value={title}
            onChange={(e) => onTitle(e.target.value)}
          />
        </InspectorField>
      </InspectorSection>

      <InspectorSection title="Search">
        <InspectorField label="SEO title" hint={<Count n={seoTitle.length} max={60} />}>
          <input
            className={INSPECTOR_INPUT}
            value={seoTitle}
            onChange={(e) => onSeoTitle(e.target.value)}
          />
        </InspectorField>
        <InspectorField
          label="SEO description"
          hint={<Count n={seoDescription.length} max={160} />}
        >
          <textarea
            className={INSPECTOR_TEXTAREA}
            value={seoDescription}
            onChange={(e) => onSeoDescription(e.target.value)}
          />
        </InspectorField>
        <InspectorField label="Canonical">
          <input
            className={`${INSPECTOR_INPUT} font-mono text-xs`}
            value={canonicalPath}
            onChange={(e) => onCanonicalPath(e.target.value)}
            placeholder="/gift"
          />
        </InspectorField>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium">Indexing</span>
          <div className="flex gap-0.5 rounded-lg bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] p-0.5">
            <button
              type="button"
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                robotsIndex
                  ? 'bg-[var(--foreground)] text-[var(--background)]'
                  : 'hover:bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)]'
              }`}
              onClick={() => onRobotsIndex(true)}
            >
              Index
            </button>
            <button
              type="button"
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                !robotsIndex
                  ? 'bg-[var(--foreground)] text-[var(--background)]'
                  : 'hover:bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)]'
              }`}
              onClick={() => onRobotsIndex(false)}
            >
              Noindex
            </button>
          </div>
        </div>
      </InspectorSection>

      <InspectorSection title="Social">
        <InspectorField label="Share image">
          <CmsMediaField value={ogImageUrl} onChange={onOgImageUrl} />
        </InspectorField>
      </InspectorSection>

      <InspectorSection title="Schema">
        <ProductSeoSchemaField
          embedded
          autoLabel="Auto"
          manualLabel="Manual"
          emptyPreview="Add a page title to preview"
          radioName="cms-schema-mode"
          value={seoSchemaExtras}
          onChange={onSeoSchemaExtras}
          autoPreviewNodes={autoPreviewNodes}
          publicUrl={publicUrl}
        />
      </InspectorSection>
    </div>
  );
}
