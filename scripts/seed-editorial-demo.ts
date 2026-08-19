/**
 * Idempotent demo journal article. Does not run full prisma seed.
 * Usage: pnpm exec tsx scripts/seed-editorial-demo.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const contentUser = await prisma.user.findUnique({ where: { email: 'content@test.inabiya' } });
  if (!contentUser) {
    console.log('skip: content@test.inabiya missing');
    return;
  }
  const demoSlug = 'first-weeks-at-home';
  const existing = await prisma.article.findUnique({ where: { slug: demoSlug } });
  if (existing) {
    console.log(`skip: ${demoSlug} already exists`);
    return;
  }
  const writerUser = await prisma.user.findUnique({ where: { email: 'writer@test.inabiya' } });
  const newbornCat = await prisma.editorialCategory.findUnique({ where: { slug: 'newborn-care' } });
  const specialist = await prisma.specialistProfile.findUnique({
    where: { slug: 'dr-meera-sharma' },
  });
  await prisma.article.create({
    data: {
      title: 'The first weeks at home',
      slug: demoSlug,
      body: '<p>The first weeks are about rest, feeding, and a small circle of help. Keep the room dim at night, and ask visitors to wait until you are ready.</p><p>If something about feeding or fever worries you, talk to your paediatrician — this journal is guidance, not a diagnosis.</p>',
      status: 'PUBLISHED',
      medicalGateRequired: true,
      createdById: contentUser.id,
      assigneeId: writerUser?.id ?? null,
      categoryId: newbornCat?.id ?? null,
      specialistId: specialist?.id ?? null,
      seoTitle: 'The first weeks at home',
      seoDescription: 'Calm notes for the first weeks with a newborn.',
      canonicalPath: `/blog/${demoSlug}`,
      publishedAt: new Date(),
      statusHistory: {
        create: [
          { status: 'ASSIGNED', actorId: contentUser.id },
          { status: 'DRAFT', actorId: writerUser?.id ?? contentUser.id },
          { status: 'SEO_REVIEW', actorId: contentUser.id },
          { status: 'MEDICAL_REVIEW', actorId: contentUser.id },
          { status: 'APPROVED', actorId: contentUser.id },
          { status: 'PUBLISHED', actorId: contentUser.id },
        ],
      },
    },
  });
  console.log('created first-weeks-at-home');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
