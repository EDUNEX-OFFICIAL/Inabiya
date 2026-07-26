/**
 * Upsert full body + SEO for the published demo article.
 * Usage (from repo root, with DATABASE_URL):
 *   npx tsx scripts/update-sleep-cues-article.ts
 * Or via API container with env mounted.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SLUG = 'sleep-cues-for-newborns';

async function main() {
  const bodyPath = resolve(__dirname, '../content/articles/sleep-cues-for-newborns.html');
  const body = readFileSync(bodyPath, 'utf8').trim();

  const existing = await prisma.article.findUnique({ where: { slug: SLUG } });
  if (!existing) {
    throw new Error(`Article not found: ${SLUG}`);
  }

  const seoTitle = 'Sleep Cues for Newborns: Early Signs They’re Ready to Rest';
  const seoDescription =
    'Learn early, mid, and late newborn sleep cues, a gentle settle routine, day/night tips, and safe sleep basics — practical guidance for the first weeks.';

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
        title: 'Sleep cues for newborns',
        body,
        seoTitle,
        seoDescription,
        ogImageUrl: existing.ogImageUrl ?? '/gift/media/sleep-cues-for-newborn.svg',
        status: 'PUBLISHED',
        publishedAt: existing.publishedAt ?? new Date(),
      },
    });
  });

  console.log(`Updated ${SLUG}: body ${body.length} chars`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
