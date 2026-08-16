import type { Metadata } from 'next';
import { fetchCatalog, type CatalogProduct } from '@/lib/catalog';

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

export default function ProductSlugLayout({ children }: { children: React.ReactNode }) {
  return children;
}
