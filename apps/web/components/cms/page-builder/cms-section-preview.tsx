'use client';

import { useDeferredValue, useMemo } from 'react';
import { CmsHeroByLayout } from '@/components/cms/gift-hero-layouts';
import { MarketingPageBlocks } from '@/components/cms/marketing-page-blocks';
import { blockToCmsPreview, type Block } from './cms-page-model';

type Props = {
  block: Block | null;
  extras?: Record<string, unknown>;
};

export function CmsSectionPreview({ block, extras }: Props) {
  const deferredBlock = useDeferredValue(block);
  const deferredExtras = useDeferredValue(extras);

  const result = useMemo(() => {
    if (!deferredBlock) return null;
    return blockToCmsPreview(deferredBlock, deferredExtras);
  }, [deferredBlock, deferredExtras]);

  if (!block) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]">
        <p className="ops-muted text-sm">Select a block</p>
      </div>
    );
  }

  if (!result) return null;

  if (!result.ok) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-4 text-sm text-red-800">
        {result.error}
      </div>
    );
  }

  const inner =
    result.block.type === 'hero' ? (
      <CmsHeroByLayout props={result.block.props} pageLayout="page" />
    ) : (
      <MarketingPageBlocks blocks={[result.block]} layout="page" emitFaqJsonLd={false} />
    );

  return <div className="pointer-events-none [transform:translateZ(0)]">{inner}</div>;
}
