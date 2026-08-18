import type { Metadata } from 'next';
import { fetchCatalog, type CatalogProduct } from '@/lib/catalog';
import { mediaVariantUrl, parseMediaAssetId } from '@/lib/media-url';

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  try {
    const product = await fetchCatalog<CatalogProduct>(`/catalog/products/${params.slug}`);
    const title = product.seoTitle?.trim() || product.title;
    const description =
      product.seoDescription?.trim() || product.description?.trim()?.slice(0, 160) || undefined;
    const canonical = product.canonicalPath?.trim() || `/products/${product.slug}`;
    const og = product.ogImageUrl?.trim() || product.media[0]?.url || undefined;
    return {
      title,
      description,
      alternates: { canonical },
      robots: product.robotsIndex === false ? { index: false, follow: false } : undefined,
      openGraph: {
        title,
        description,
        images: og ? [og] : undefined,
        type: 'website',
      },
    };
  } catch {
    return { title: 'Product' };
  }
}

export default async function ProductSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  let lcp: string | null = null;
  try {
    const product = await fetchCatalog<CatalogProduct>(`/catalog/products/${params.slug}`);
    const first = product.media.find((m) => m.kind !== 'VIDEO') ?? product.media[0];
    if (first?.url && parseMediaAssetId(first.url)) lcp = mediaVariantUrl(first.url, 'web');
  } catch {
    lcp = null;
  }
  return (
    <>
      {lcp ? <link rel="preload" as="image" href={lcp} fetchPriority="high" /> : null}
      {children}
    </>
  );
}
