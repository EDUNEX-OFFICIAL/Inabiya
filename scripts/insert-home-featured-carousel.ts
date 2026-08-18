/**
 * Insert `featuredCarousel` after the last hero on MarketingPage `home`
 * without wiping other blocks. Skips if the type already exists.
 * Usage: pnpm exec tsx scripts/insert-home-featured-carousel.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const cards = [
  {
    id: 'build-box',
    category: 'Create',
    kicker: 'Gift Builder',
    title: 'Build Your Box',
    description:
      'Design a bespoke baby box in six gentle steps — pick recipient, age, occasion & budget, we curate the rest.',
    imageUrl: 'https://images.unsplash.com/photo-1622290291720-ac961c43ee30?w=800&q=85',
    hoverImageUrl: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&q=85',
    gradient: 'linear-gradient(150deg,#FF6B9D 0%,#FFB5D0 55%,#FFE0EC 100%)',
    accent: '#7C1D3C',
    href: '/build-your-box',
  },
  {
    id: 'keepsakes',
    category: 'Create',
    kicker: 'Personalised',
    title: 'Name & Note Keepsakes',
    description:
      "Add the baby's name, a handwritten gift note and a ribbon colour to make every hamper unmistakably theirs.",
    imageUrl: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800&q=85',
    hoverImageUrl: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&q=85',
    gradient: 'linear-gradient(150deg,#E8D5F5 0%,#F5C8E4 55%,#FFE0EC 100%)',
    accent: '#5B21B6',
    href: '/build-your-box',
  },
  {
    id: 'milestone-toys',
    category: 'Develop',
    kicker: 'Play & Learn',
    title: 'Milestone Toys',
    description:
      'Montessori-inspired wooden toys that grow with baby — sensory, safe and beautifully made for little hands.',
    imageUrl: 'https://images.unsplash.com/photo-1609811645795-f72ea07f47e9?w=800&q=85',
    hoverImageUrl: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&q=85',
    gradient: 'linear-gradient(150deg,#B5EAD7 0%,#D9F5E9 55%,#E0F7EE 100%)',
    accent: '#0F5132',
    href: '/collections/bestsellers',
  },
  {
    id: 'first-year',
    category: 'Develop',
    kicker: 'Essentials',
    title: 'First-Year Essentials',
    description:
      'Clothing, bath, skincare and feeding staples from baby-safe brands parents actually trust — all in one place.',
    imageUrl: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=800&q=85',
    hoverImageUrl: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&q=85',
    gradient: 'linear-gradient(150deg,#7DD3FC 0%,#BAE6FD 55%,#E0F2FE 100%)',
    accent: '#0C4A6E',
    href: '/collections/newborn',
  },
  {
    id: 'ready-hampers',
    category: 'Explore',
    kicker: 'Ready to Gift',
    title: 'Ready-Made Hampers',
    description:
      'Beautifully packed, occasion-ready hampers with complimentary wrapping — order in a tap, delivered across India.',
    imageUrl: 'https://images.unsplash.com/photo-1635874714425-c342060a4c58?w=800&q=85',
    hoverImageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=85',
    gradient: 'linear-gradient(150deg,#FFD166 0%,#FFE3A3 55%,#FFF4D6 100%)',
    accent: '#7C4A03',
    href: '/collections/ready-hampers',
  },
  {
    id: 'corporate',
    category: 'Explore',
    kicker: 'For Teams',
    title: 'Corporate Gifting',
    description:
      'Thoughtful welcome-baby gifts for your people — branded cards, bulk pricing and PAN-India delivery.',
    imageUrl: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800&q=85',
    hoverImageUrl: 'https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=800&q=85',
    gradient: 'linear-gradient(150deg,#C7D2FE 0%,#DDD6FE 55%,#EDE9FE 100%)',
    accent: '#3730A3',
    href: '/corporate',
  },
];

async function main() {
  const home = await prisma.marketingPage.findUnique({
    where: { slug: 'home' },
    include: { blocks: { orderBy: { sortOrder: 'asc' } } },
  });
  if (!home) {
    console.log('No home marketing page — skip');
    return;
  }
  if (home.blocks.some((b) => b.type === 'featuredCarousel')) {
    console.log('home already has featuredCarousel — skip');
    return;
  }

  const lastHero = [...home.blocks].reverse().find((b) => b.type === 'hero');
  const insertAt = lastHero ? lastHero.sortOrder + 1 : 0;

  const later = home.blocks.filter((b) => b.sortOrder >= insertAt);
  for (const block of later.reverse()) {
    await prisma.pageBlock.update({
      where: { id: block.id },
      data: { sortOrder: block.sortOrder + 1 },
    });
  }

  await prisma.pageBlock.create({
    data: {
      pageId: home.id,
      type: 'featuredCarousel',
      sortOrder: insertAt,
      props: {
        eyebrow: 'Explore Inabiya',
        headline: 'A different way to gift',
        accentWord: 'gift',
        subcopy:
          'Swipe through the ways to gift with Inabiya — create, develop and explore, all in one place.',
        cards,
      },
    },
  });
  console.log(`Inserted featuredCarousel on home at sortOrder ${insertAt}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
