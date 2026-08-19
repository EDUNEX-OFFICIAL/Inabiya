import type { PrismaClient } from '@prisma/client';

export const ARTICLE_TAG_MAX = 12;

type TagDb = Pick<PrismaClient, 'articleTag'>;

export function articleTagSlug(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

export function articleTagName(raw: string, slug: string): string {
  const trimmed = raw.trim().slice(0, 80);
  if (!trimmed || trimmed === slug) return slug.replace(/-/g, ' ');
  return trimmed;
}

/** Upsert tags from typed names or slugs. Skips short/duplicate slugs. Caps at 12. */
export async function upsertArticleTagIds(db: TagDb, inputs: string[]): Promise<string[]> {
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const raw of inputs) {
    if (ids.length >= ARTICLE_TAG_MAX) break;
    const slug = articleTagSlug(raw);
    if (slug.length < 2 || seen.has(slug)) continue;
    seen.add(slug);
    const tag = await db.articleTag.upsert({
      where: { slug },
      create: { slug, name: articleTagName(raw, slug) },
      update: {},
    });
    ids.push(tag.id);
  }
  return ids;
}
