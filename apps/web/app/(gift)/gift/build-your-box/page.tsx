'use client';

import { Suspense } from 'react';
import { BuildYourBoxWizard } from '@/components/gift/build-your-box-wizard';
import { GiftListSkeleton } from '@/components/gift/gift-skeletons';

export default function GiftBoxPage() {
  return (
    <Suspense fallback={<GiftListSkeleton label="Loading gift box" />}>
      <BuildYourBoxWizard />
    </Suspense>
  );
}
