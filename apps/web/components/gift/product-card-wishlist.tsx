'use client';

import { useEffect, useState, type MouseEvent } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { loginUrl } from '@/lib/auth-client';
import {
  ensureWishlistLoaded,
  subscribeWishlist,
  toggleWishlist,
  wishlistHas,
} from '@/lib/wishlist-client';

type Props = {
  variantId?: string | null;
  productTitle: string;
  className?: string;
};

export function ProductCardWishlist({ variantId, productTitle, className }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [, bump] = useState(0);
  const [busy, setBusy] = useState(false);
  const saved = variantId ? wishlistHas(variantId) : false;

  useEffect(() => subscribeWishlist(() => bump((n) => n + 1)), []);
  useEffect(() => {
    void ensureWishlistLoaded().then(() => bump((n) => n + 1));
  }, []);

  if (!variantId) return null;

  async function onClick(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!variantId || busy) return;
    setBusy(true);
    try {
      const result = await toggleWishlist(variantId);
      if (result === 'login') {
        router.push(loginUrl(pathname || '/gift/products'));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={(e) => void onClick(e)}
      disabled={busy}
      className={cn(
        'pointer-events-auto absolute bottom-gs-2 right-gs-2 z-10 inline-flex size-9 items-center justify-center rounded-pill bg-white/95 text-foreground shadow-clay hover:text-primary disabled:opacity-60',
        className,
      )}
      aria-label={
        saved ? `Remove ${productTitle} from wishlist` : `Save ${productTitle} to wishlist`
      }
      aria-pressed={saved}
    >
      <Heart
        className={saved ? 'fill-primary text-primary' : ''}
        size={18}
        strokeWidth={1.75}
        aria-hidden
      />
    </button>
  );
}
