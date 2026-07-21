'use client';

import { useEffect } from 'react';
import { trackEvent } from '@/lib/analytics';

export function TrackView({
  name,
  productId,
}: {
  name: 'view_plp' | 'view_pdp' | 'begin_checkout';
  productId?: string;
}) {
  useEffect(() => {
    trackEvent(name, { productId });
  }, [name, productId]);
  return null;
}
