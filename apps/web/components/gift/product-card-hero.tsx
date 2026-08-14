'use client';

import Image from 'next/image';
import Link from 'next/link';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { CardThumbStrip } from '@/components/gift/card-thumb-strip';
import { productCardImages, type ProductCardImage } from '@/components/gift/card-thumbs';

type Media = {
  url: string;
  altText: string | null;
  kind?: string | null;
  id?: string | null;
};

type GalleryValue = {
  images: ProductCardImage[];
  hero: ProductCardImage | undefined;
  select: (id: string) => void;
  title: string;
};

const GalleryCtx = createContext<GalleryValue | null>(null);

function useGallery() {
  const ctx = useContext(GalleryCtx);
  if (!ctx) {
    throw new Error('ProductCardGallery required');
  }
  return ctx;
}

/** Owns which gallery photo is showing so the hero and the body thumbs stay in sync. */
export function ProductCardGallery({
  media,
  title,
  children,
}: {
  media: Media[];
  title: string;
  children: ReactNode;
}) {
  const images = useMemo(() => productCardImages(media), [media]);
  const [active, setActive] = useState(0);
  const safe = images.length === 0 ? 0 : Math.min(active, images.length - 1);
  const hero = images[safe];
  const select = useCallback(
    (id: string) => {
      const i = images.findIndex((img) => img.id === id);
      if (i >= 0) setActive(i);
    },
    [images],
  );
  const value = useMemo(() => ({ images, hero, select, title }), [images, hero, select, title]);

  return <GalleryCtx.Provider value={value}>{children}</GalleryCtx.Provider>;
}

type HeroProps = {
  href: string;
  sizes: string;
  className?: string;
  imageClassName?: string;
  linkTestId?: string;
  children?: ReactNode;
};

/** Card photo only — badges/wishlist as children. Gallery thumbs live in the text block. */
export function ProductCardHero({
  href,
  sizes,
  className,
  imageClassName,
  linkTestId,
  children,
}: HeroProps) {
  const { hero, title } = useGallery();

  return (
    <div className={cn('relative overflow-hidden bg-white/40', className)}>
      <Link href={href} className="absolute inset-0 block" data-testid={linkTestId}>
        {hero?.url ? (
          <Image
            src={hero.url}
            alt={hero.altText ?? title}
            fill
            sizes={sizes}
            className={cn('object-cover', imageClassName)}
          />
        ) : (
          <div className="gift-media-fallback absolute inset-0" />
        )}
      </Link>
      {children}
    </div>
  );
}

/** Extra photos under title/price, above CTAs. Hidden when there is only one still. */
export function ProductCardThumbs({ className }: { className?: string }) {
  const { images, hero, select, title } = useGallery();
  return (
    <CardThumbStrip
      items={images.map((img) => ({
        id: img.id,
        imageUrl: img.url,
        alt: img.altText ?? title,
      }))}
      hideIfSingle
      activeId={hero?.id}
      onSelect={select}
      className={className}
    />
  );
}
