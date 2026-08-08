export type CollectionPageJsonLdInput = {
  name: string;
  description?: string | null;
  slug: string;
  canonicalPath?: string | null;
  imageUrl?: string | null;
  siteOrigin: string;
  /** Products currently shown on the PLP (capped by caller). */
  products: Array<{ name: string; slug: string; url?: string }>;
};

/** Soft Gift collection PLP — CollectionPage + ItemList (auto, no admin extras). */
export function collectionPageJsonLd(
  input: CollectionPageJsonLdInput,
): Record<string, unknown> {
  const origin = input.siteOrigin.replace(/\/$/, '');
  const path = input.canonicalPath?.trim() || `/gift/collections/${input.slug}`;
  const url = path.startsWith('http')
    ? path
    : `${origin}${path.startsWith('/') ? path : `/${path}`}`;
  const image = input.imageUrl?.trim()
    ? input.imageUrl.startsWith('http')
      ? input.imageUrl.trim()
      : `${origin}${input.imageUrl.startsWith('/') ? input.imageUrl : `/${input.imageUrl}`}`
    : undefined;

  const itemListElement = input.products.map((p, i) => {
    const productPath = `/gift/products/${p.slug}`;
    const productUrl = p.url?.startsWith('http') ? p.url : `${origin}${productPath}`;
    return {
      '@type': 'ListItem',
      position: i + 1,
      url: productUrl,
      name: p.name,
      item: {
        '@type': 'Product',
        name: p.name,
        url: productUrl,
      },
    };
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: input.name,
    ...(input.description?.trim() ? { description: input.description.trim() } : {}),
    url,
    ...(image ? { image } : {}),
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: itemListElement.length,
      itemListElement,
    },
  };
}
