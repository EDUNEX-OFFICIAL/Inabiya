/**
 * Expand published Journal article bodies from content/articles/*.html
 * Usage (repo root, DATABASE_URL set):
 *   npx tsx scripts/expand-published-blog-articles.ts
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ARTICLES: Array<{
  slug: string;
  file: string;
  title?: string;
  seoTitle: string;
  seoDescription: string;
  ogImageUrl?: string;
}> = [
  {
    slug: 'uat-visitors-first-fortnight',
    file: 'uat-visitors-first-fortnight.html',
    title: 'Visitors in the first fortnight',
    seoTitle: 'Visitors in the First Fortnight: Gentle Etiquette for Newborn Weeks',
    seoDescription:
      'Keep early visits short and calm: house rules, hand hygiene, feeding-friendly timing, and sample messages so rest comes before entertaining in the first two weeks.',
    ogImageUrl: '/parenting.svg',
  },
  {
    slug: 'understanding-newborn-sleep-cycles',
    file: 'understanding-newborn-sleep-cycles.html',
    title: 'Understanding newborn sleep cycles',
    seoTitle: 'Understanding Newborn Sleep Cycles: Light Sleep, Night Waking & Calm Nights',
    seoDescription:
      'How newborn sleep cycles work in the first weeks — light vs deep sleep, brief arousals, day/night cues, safe sleep, and when to ask a paediatrician.',
  },
  {
    slug: 'sleep-cues-for-newborns',
    file: 'sleep-cues-for-newborns.html',
    title: 'Sleep cues for newborns',
    seoTitle: 'Sleep Cues for Newborns: Early Signs They’re Ready to Rest',
    seoDescription:
      'Learn early, mid, and late newborn sleep cues, a gentle settle routine, day/night tips, and safe sleep basics — practical guidance for the first weeks.',
    ogImageUrl: '/gift/media/sleep-cues-for-newborn.svg',
  },
];

function wordCount(html: string): number {
  const plain = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return plain ? plain.split(' ').length : 0;
}

async function main() {
  for (const spec of ARTICLES) {
    const bodyPath = resolve(__dirname, '../content/articles', spec.file);
    const body = readFileSync(bodyPath, 'utf8').trim();
    const existing = await prisma.article.findUnique({ where: { slug: spec.slug } });
    if (!existing) {
      throw new Error(`Article not found: ${spec.slug}`);
    }

    await prisma.$transaction(async (tx) => {
      await tx.articleRevision.create({
        data: {
          articleId: existing.id,
          title: existing.title,
          body: existing.body,
        },
      });

      await tx.article.update({
        where: { id: existing.id },
        data: {
          ...(spec.title ? { title: spec.title } : {}),
          body,
          seoTitle: spec.seoTitle,
          seoDescription: spec.seoDescription,
          ...(spec.ogImageUrl ? { ogImageUrl: existing.ogImageUrl ?? spec.ogImageUrl } : {}),
          status: 'PUBLISHED',
          publishedAt: existing.publishedAt ?? new Date(),
        },
      });
    });

    const words = wordCount(body);
    const mins = Math.max(1, Math.round(words / 220));
    console.log(`Updated ${spec.slug}: ${words} words (~${mins} min), body ${body.length} chars`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
