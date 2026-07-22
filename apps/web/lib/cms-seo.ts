import type { Metadata } from 'next';
import { GIFT_CORPORATE_SLUG, GIFT_HOMEPAGE_SLUG } from '@inabiya/validation';

export type CmsSeoPage = {
  slug: string;
  title: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  canonicalPath?: string | null;
  ogImageUrl?: string | null;
  robotsIndex?: boolean | null;
};

function siteOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    'https://inabiya.edunexservices.in';
  return raw.replace(/\/$/, '');
}

export function defaultPathForCmsSlug(slug: string): string {
  if (slug === GIFT_HOMEPAGE_SLUG) return '/gift';
  if (slug === GIFT_CORPORATE_SLUG) return '/gift/corporate';
  return `/pages/${slug}`;
}

function absolutize(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${siteOrigin()}${path}`;
}

export function marketingPageMetadata(page: CmsSeoPage): Metadata {
  const title = page.seoTitle?.trim() || page.title;
  const description = page.seoDescription?.trim() || undefined;
  const canonicalPath = page.canonicalPath?.trim() || defaultPathForCmsSlug(page.slug);
  const canonical = absolutize(canonicalPath);
  const index = page.robotsIndex !== false;
  const ogImage = page.ogImageUrl?.trim()
    ? absolutize(page.ogImageUrl.trim())
    : undefined;

  return {
    title,
    description,
    alternates: { canonical },
    robots: index
      ? { index: true, follow: true }
      : { index: false, follow: false },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export function webPageJsonLd(page: CmsSeoPage): Record<string, unknown> {
  const canonicalPath = page.canonicalPath?.trim() || defaultPathForCmsSlug(page.slug);
  const url = absolutize(canonicalPath);
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: page.seoTitle?.trim() || page.title,
    ...(page.seoDescription?.trim() ? { description: page.seoDescription.trim() } : {}),
    url,
  };
}

export function getSiteOrigin(): string {
  return siteOrigin();
}
