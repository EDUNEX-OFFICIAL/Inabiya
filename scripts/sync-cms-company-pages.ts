/**
 * One-shot: remove CMS test pages + upsert About / Contact / Privacy MarketingPages.
 * Usage: pnpm exec tsx scripts/sync-cms-company-pages.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const pages: Array<{
  slug: string;
  title: string;
  seoTitle: string;
  seoDescription: string;
  canonicalPath: string;
  blocks: Array<{ type: string; sortOrder: number; props: Record<string, unknown> }>;
}> = [
  {
    slug: 'about',
    title: 'About us',
    seoTitle: 'About Inabiya',
    seoDescription: 'Thoughtfully personalised baby essentials and Soft Gift gifting across India.',
    canonicalPath: '/about',
    blocks: [
      {
        type: 'hero',
        sortOrder: 0,
        props: {
          variant: 'panel',
          layout: 'fullText',
          eyebrow: 'Our story',
          headline: 'Gifts that feel like a warm hug',
          subcopy:
            'Inabiya is built for new parents and the people who love them — curated baby-safe brands, personalised keepsakes, and ready-made hampers that arrive with care.',
          ctaLabel: 'Shop gifts',
          ctaHref: '/',
          ctaLabel2: 'Contact us',
          ctaHref2: '/contact',
        },
      },
      {
        type: 'richText',
        sortOrder: 1,
        props: {
          html: '<p>We believe gifting should be gentle: fewer decisions, clearer choices, and boxes you would be proud to unwrap. From Build Your Box to corporate bulk orders, every path stays soft, thoughtful, and India-ready.</p>',
        },
      },
    ],
  },
  {
    slug: 'contact',
    title: 'Contact',
    seoTitle: 'Contact Inabiya',
    seoDescription: 'Reach Soft Gift support by email or WhatsApp.',
    canonicalPath: '/contact',
    blocks: [
      {
        type: 'hero',
        sortOrder: 0,
        props: {
          variant: 'panel',
          layout: 'fullText',
          eyebrow: 'Hello',
          headline: 'We’d love to hear from you',
          subcopy:
            'Questions about an order, personalisation, or corporate gifting? Pick the channel that feels easiest.',
          ctaLabel: 'Email us',
          ctaHref: 'mailto:hello@inabiya.in',
          ctaLabel2: 'WhatsApp',
          ctaHref2: 'https://wa.me/919693940330',
        },
      },
      {
        type: 'richText',
        sortOrder: 1,
        props: {
          html: '<p><strong>Email</strong> — <a href="mailto:hello@inabiya.in">hello@inabiya.in</a></p><p><strong>WhatsApp</strong> — <a href="https://wa.me/919693940330">+91 96939 40330</a></p><p><strong>Corporate gifting</strong> — <a href="/corporate">Request a quote</a></p>',
        },
      },
    ],
  },
  {
    slug: 'privacy-policy',
    title: 'Privacy policy',
    seoTitle: 'Privacy policy | Inabiya',
    seoDescription: 'How Inabiya Soft Gift handles account and order information.',
    canonicalPath: '/privacy-policy',
    blocks: [
      {
        type: 'hero',
        sortOrder: 0,
        props: {
          variant: 'panel',
          layout: 'fullText',
          eyebrow: 'Legal',
          headline: 'Privacy policy',
          subcopy: 'A short overview of how we use information on Soft Gift.',
        },
      },
      {
        type: 'richText',
        sortOrder: 1,
        props: {
          html: '<p>We collect account details (such as email and name) and order information so we can fulfil gifts, personalise products where requested, and support you after purchase.</p><p>Payment card data is handled by our payment provider — we do not store full card numbers.</p><p>We may use cookies or similar storage for login sessions, cart, and basic analytics needed to run the shop.</p><p>For privacy questions or data requests, email <a href="mailto:hello@inabiya.in">hello@inabiya.in</a>.</p>',
        },
      },
    ],
  },
];

async function upsertPage(page: (typeof pages)[number]) {
  const existing = await prisma.marketingPage.findUnique({ where: { slug: page.slug } });
  if (existing) {
    await prisma.pageBlock.deleteMany({ where: { pageId: existing.id } });
    await prisma.marketingPage.update({
      where: { id: existing.id },
      data: {
        title: page.title,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
        canonicalPath: page.canonicalPath,
        robotsIndex: true,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        blocks: {
          create: page.blocks.map((b) => ({
            type: b.type,
            sortOrder: b.sortOrder,
            props: b.props,
          })),
        },
      },
    });
  } else {
    await prisma.marketingPage.create({
      data: {
        slug: page.slug,
        title: page.title,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
        canonicalPath: page.canonicalPath,
        robotsIndex: true,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        blocks: {
          create: page.blocks.map((b) => ({
            type: b.type,
            sortOrder: b.sortOrder,
            props: b.props,
          })),
        },
      },
    });
  }
  console.log(`upserted ${page.slug}`);
}

async function main() {
  const testDeleted = await prisma.marketingPage.deleteMany({
    where: {
      OR: [
        { slug: { startsWith: 'welcome-test' } },
        { slug: { startsWith: 'dnd-test' } },
        { title: { equals: 'Draft' } },
        { title: { equals: 'Welcome Test' } },
        { title: { equals: 'DnD Test' } },
      ],
    },
  });
  console.log(`deleted test pages: ${testDeleted.count}`);

  for (const page of pages) {
    await upsertPage(page);
  }

  const chrome = await prisma.commerceSetting.findUnique({ where: { key: 'gift.chrome' } });
  if (chrome && chrome.value && typeof chrome.value === 'object') {
    const value = chrome.value as Record<string, unknown>;
    const footer = (value.footer ?? {}) as Record<string, unknown>;
    footer.legalLinks = [
      { label: 'Privacy', href: '/privacy-policy' },
      { label: 'Contact', href: '/contact' },
    ];
    value.footer = footer;
    await prisma.commerceSetting.update({
      where: { key: 'gift.chrome' },
      data: { value },
    });
    console.log('updated gift.chrome legalLinks');
  }

  const remaining = await prisma.marketingPage.findMany({
    select: { slug: true, title: true, status: true },
    orderBy: { title: 'asc' },
  });
  console.log(JSON.stringify(remaining, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
