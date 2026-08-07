import Link from 'next/link';
import Image from 'next/image';
import { formatInr, type CatalogProduct } from '@/lib/catalog';

export function HamperWhatsInside({ product }: { product: CatalogProduct }) {
  const items = product.hamperItems ?? [];
  if (!product.isReadyMadeHamper || items.length === 0) return null;

  return (
    <section aria-labelledby="whats-inside">
      <h2 id="whats-inside" className="gift-h2">
        What’s inside
      </h2>
      <p className="gift-muted mt-gs-2">
        {product.hamperItemCount ?? items.length} item
        {(product.hamperItemCount ?? items.length) === 1 ? '' : 's'} curated in this hamper
        {product.contentsValuePaise != null && product.contentsValuePaise > 0
          ? ` · worth ${formatInr(product.contentsValuePaise)} if bought separately`
          : ''}
        .
      </p>
      <ul className="mt-gs-5 grid gap-gs-3 sm:grid-cols-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex gap-gs-3 rounded-control border border-foreground/8 bg-white/60 p-gs-3"
          >
            <div className="relative size-16 shrink-0 overflow-hidden rounded-control bg-foreground/5 sm:size-20">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              ) : (
                <div className="gift-media-fallback h-full w-full" aria-hidden />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium leading-snug text-foreground">
                {item.title}
                {item.qty > 1 ? (
                  <span className="ml-gs-1 text-caption font-normal opacity-60">×{item.qty}</span>
                ) : null}
              </p>
              {item.brandName ? (
                <p className="mt-gs-1 text-caption text-foreground/55">
                  <span className="font-semibold uppercase tracking-wide">Brand:</span>{' '}
                  {item.brandName}
                </p>
              ) : null}
              {item.blurb ? (
                <p className="mt-gs-1 line-clamp-2 text-caption text-foreground/60">{item.blurb}</p>
              ) : null}
              <p className="mt-gs-2 text-body font-semibold text-primary">
                {formatInr(item.unitPricePaise)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function HamperActionBar({ product }: { product: CatalogProduct }) {
  if (!product.isReadyMadeHamper) return null;
  return (
    <section
      className="overflow-hidden rounded-clay bg-gradient-to-r from-primary/20 via-[color:var(--inabiya-sky)]/40 to-primary/10 px-gs-5 py-gs-5 sm:px-gs-6"
      aria-label="Hamper actions"
    >
      <div className="flex flex-col gap-gs-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="gift-h2">{product.title}</p>
          <p className="mt-gs-1 text-body text-foreground/65">
            Take this ready set, or build a custom box with your own picks.
          </p>
        </div>
        <div className="flex flex-wrap gap-gs-2">
          <a href="#buy" className="clay-btn !min-h-0 !px-gs-4 !py-gs-2 text-body">
            Buy this hamper
          </a>
          <Link
            href={`/gift/build-your-box${product.recipientTags?.[0] ? `?recipient=${product.recipientTags[0]}` : ''}`}
            className="clay-btn-secondary !min-h-0 !px-gs-4 !py-gs-2 text-body"
          >
            Create your own
          </Link>
        </div>
      </div>
    </section>
  );
}

import { ArticleBody } from '@/components/editorial/article-body';
import { seoSectionsToHtml } from '@/lib/product-page-content';

export function ProductSeoSections({
  sections,
}: {
  sections: Array<{ heading: string; bodyText: string }> | null | undefined;
}) {
  const html = seoSectionsToHtml(sections);
  if (!html.trim()) return null;
  return (
    <section aria-label="Product details">
      <ArticleBody body={html} className="text-foreground/85" />
    </section>
  );
}

/** Standalone video band when first VIDEO media exists (below buy box story). */
export function PdpVideoBand({ product }: { product: CatalogProduct }) {
  const video = product.media.find((m) => m.kind === 'VIDEO');
  if (!video) return null;
  const poster = video.posterUrl || product.media.find((m) => m.kind !== 'VIDEO')?.url || video.url;
  return (
    <section aria-labelledby="unboxing-video">
      <h2 id="unboxing-video" className="sr-only">
        Unboxing video
      </h2>
      <a
        href="#gallery"
        className="group relative block overflow-hidden rounded-clay"
      >
        <div className="relative aspect-[21/9] w-full">
          <Image
            src={poster}
            alt=""
            fill
            sizes="100vw"
            className="object-cover transition group-hover:scale-[1.01]"
          />
        </div>
        <span className="absolute inset-0 flex flex-col items-center justify-center bg-foreground/35 px-gs-4 text-center text-white">
          <span className="flex size-14 items-center justify-center rounded-pill bg-white/95 text-primary shadow-clay">
            ▶
          </span>
          <span className="mt-gs-3 gift-h2">
            See the unboxing
          </span>
          <span className="mt-gs-1 text-body text-white/85">Right choice for your little one</span>
        </span>
      </a>
    </section>
  );
}
