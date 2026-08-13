import type { SeoSchemaEntry, SeoSchemaPreset } from '@inabiya/validation';
import { faqPageJsonLd } from '@/components/gift/faq-json-ld';

export type JsonLdNode = Record<string, unknown>;

/** Strip @context from nodes before placing in @graph. */
export function stripContext(node: JsonLdNode): JsonLdNode {
  const { ['@context']: _ctx, ...rest } = node;
  return rest;
}

export function compilePresetToJsonLd(
  entry: Extract<SeoSchemaEntry, { mode: 'preset' }>,
): JsonLdNode | null {
  const { preset, fields } = entry;
  switch (preset) {
    case 'HowTo': {
      const f = fields as {
        name: string;
        description?: string;
        steps: Array<{ name: string; text: string }>;
      };
      return {
        '@type': 'HowTo',
        name: f.name,
        ...(f.description ? { description: f.description } : {}),
        step: f.steps.map((s, i) => ({
          '@type': 'HowToStep',
          position: i + 1,
          name: s.name,
          text: s.text,
        })),
      };
    }
    case 'Organization': {
      const f = fields as {
        name: string;
        url?: string;
        logoUrl?: string;
        description?: string;
      };
      return {
        '@type': 'Organization',
        name: f.name,
        ...(f.url ? { url: f.url } : {}),
        ...(f.logoUrl ? { logo: f.logoUrl } : {}),
        ...(f.description ? { description: f.description } : {}),
      };
    }
    case 'BreadcrumbList': {
      const f = fields as { items: Array<{ name: string; url: string }> };
      return {
        '@type': 'BreadcrumbList',
        itemListElement: f.items.map((item, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: item.name,
          item: item.url,
        })),
      };
    }
    case 'Person': {
      const f = fields as {
        name: string;
        jobTitle?: string;
        url?: string;
        imageUrl?: string;
      };
      return {
        '@type': 'Person',
        name: f.name,
        ...(f.jobTitle ? { jobTitle: f.jobTitle } : {}),
        ...(f.url ? { url: f.url } : {}),
        ...(f.imageUrl ? { image: f.imageUrl } : {}),
      };
    }
    case 'ImageObject': {
      const f = fields as {
        url: string;
        caption?: string;
        width?: number;
        height?: number;
      };
      return {
        '@type': 'ImageObject',
        contentUrl: f.url,
        url: f.url,
        ...(f.caption ? { caption: f.caption } : {}),
        ...(f.width ? { width: f.width } : {}),
        ...(f.height ? { height: f.height } : {}),
      };
    }
    case 'FAQPage': {
      const f = fields as { items: Array<{ question: string; answerText: string }> };
      return faqPageJsonLd(f.items);
    }
    case 'ItemList': {
      const f = fields as {
        name?: string;
        items: Array<{ name: string; url: string }>;
      };
      return {
        '@type': 'ItemList',
        ...(f.name ? { name: f.name } : {}),
        itemListElement: f.items.map((item, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: item.name,
          url: item.url,
        })),
      };
    }
    default:
      return null;
  }
}

function nodesFromCustomJson(json: Record<string, unknown>): JsonLdNode[] {
  if (Array.isArray(json['@graph'])) {
    return json['@graph']
      .filter((g): g is JsonLdNode => Boolean(g && typeof g === 'object' && !Array.isArray(g)))
      .map(stripContext);
  }
  return [stripContext(json as JsonLdNode)];
}

export function compileExtrasToNodes(extras: SeoSchemaEntry[] | null | undefined): JsonLdNode[] {
  if (!extras?.length) return [];
  const out: JsonLdNode[] = [];
  for (const entry of extras) {
    if (!entry.enabled) continue;
    if (entry.mode === 'replace') {
      out.push(...nodesFromCustomJson(entry.json));
      continue;
    }
    if (entry.mode === 'preset') {
      const node = compilePresetToJsonLd(entry);
      if (node) out.push(stripContext(node));
      continue;
    }
    out.push(...nodesFromCustomJson(entry.json));
  }
  return out;
}

/**
 * Merge auto system nodes + admin extras into one @graph document.
 * System nodes win for identity; extras only add.
 * An enabled `replace` entry replaces auto + extras entirely.
 */
export function mergeSeoJsonLd(autoNodes: Array<JsonLdNode | null | undefined>): JsonLdNode | null {
  const graph = autoNodes
    .filter((n): n is JsonLdNode => Boolean(n && typeof n === 'object'))
    .map(stripContext);
  if (!graph.length) return null;
  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}

export function mergeSeoJsonLdWithExtras(
  autoNodes: Array<JsonLdNode | null | undefined>,
  extras: SeoSchemaEntry[] | null | undefined,
): JsonLdNode | null {
  const replace = extras?.find((e) => e.enabled && e.mode === 'replace');
  if (replace && replace.mode === 'replace') {
    const graph = nodesFromCustomJson(replace.json);
    if (!graph.length) return null;
    const ctx =
      typeof replace.json['@context'] === 'string'
        ? replace.json['@context']
        : 'https://schema.org';
    return { '@context': ctx, '@graph': graph };
  }

  const auto = autoNodes
    .filter((n): n is JsonLdNode => Boolean(n && typeof n === 'object'))
    .map(stripContext);
  const extra = compileExtrasToNodes(extras);
  const graph = [...auto, ...extra];
  if (!graph.length) return null;
  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}

export type ProductJsonLdInput = {
  name: string;
  description?: string | null;
  slug: string;
  canonicalPath?: string | null;
  imageUrls?: string[];
  brandName?: string | null;
  sku?: string | null;
  pricePaise: number;
  currency?: string;
  availability: 'InStock' | 'OutOfStock' | 'PreOrder';
  siteOrigin: string;
};

export function productJsonLd(input: ProductJsonLdInput): JsonLdNode {
  const path = input.canonicalPath?.trim() || `/gift/products/${input.slug}`;
  const url = path.startsWith('http')
    ? path
    : `${input.siteOrigin.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.name,
    ...(input.description?.trim() ? { description: input.description.trim() } : {}),
    url,
    ...(input.imageUrls?.length ? { image: input.imageUrls } : {}),
    ...(input.brandName?.trim()
      ? { brand: { '@type': 'Brand', name: input.brandName.trim() } }
      : {}),
    ...(input.sku ? { sku: input.sku } : {}),
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: input.currency ?? 'INR',
      price: (input.pricePaise / 100).toFixed(2),
      availability: `https://schema.org/${input.availability}`,
    },
  };
}

export type ArticleJsonLdInput = {
  headline: string;
  description?: string | null;
  slug: string;
  canonicalPath?: string | null;
  imageUrl?: string | null;
  datePublished?: string | null;
  dateModified?: string | null;
  authorName?: string | null;
  siteOrigin: string;
};

export function articleJsonLd(input: ArticleJsonLdInput): JsonLdNode {
  const path = input.canonicalPath?.trim() || `/articles/${input.slug}`;
  const url = path.startsWith('http')
    ? path
    : `${input.siteOrigin.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.headline,
    ...(input.description?.trim() ? { description: input.description.trim() } : {}),
    url,
    mainEntityOfPage: url,
    ...(input.imageUrl ? { image: [input.imageUrl] } : {}),
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
    ...(input.dateModified ? { dateModified: input.dateModified } : {}),
    ...(input.authorName?.trim()
      ? { author: { '@type': 'Person', name: input.authorName.trim() } }
      : {}),
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; url: string }>): JsonLdNode | null {
  if (!items.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export { collectionPageJsonLd, type CollectionPageJsonLdInput } from './collection-page';

export function emptyPresetFields(preset: SeoSchemaPreset): Record<string, unknown> {
  switch (preset) {
    case 'HowTo':
      return { name: '', steps: [{ name: '', text: '' }] };
    case 'Organization':
      return { name: '' };
    case 'BreadcrumbList':
      return { items: [{ name: '', url: '' }] };
    case 'Person':
      return { name: '' };
    case 'ImageObject':
      return { url: '' };
    case 'FAQPage':
      return { items: [{ question: '', answerText: '' }] };
    case 'ItemList':
      return { items: [{ name: '', url: '' }] };
    default:
      return {};
  }
}
