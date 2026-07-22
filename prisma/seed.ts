import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/** Baseline roles from Rules.md §9.5 / Phases Phase 0 */
const ROLES: Array<{ code: string; name: string; description: string }> = [
  { code: 'CUSTOMER', name: 'Customer', description: 'Gift commerce customer' },
  { code: 'COMMERCE_ADMIN', name: 'Commerce Admin', description: 'Commerce operations admin' },
  { code: 'CONTENT_ADMIN', name: 'Content Admin', description: 'Editorial operations admin' },
  { code: 'WRITER', name: 'Writer', description: 'Editorial writer' },
  { code: 'SEO_EDITOR', name: 'SEO Editor', description: 'SEO review gate' },
  { code: 'MEDICAL_REVIEWER', name: 'Medical Reviewer', description: 'Medical review gate' },
  { code: 'CREATOR', name: 'Creator', description: 'Creator Collective creator' },
  { code: 'BRAND', name: 'Brand', description: 'Creator Collective brand' },
  { code: 'FINANCE', name: 'Finance', description: 'Finance / payouts' },
  { code: 'SUPPORT', name: 'Support', description: 'Customer support' },
  { code: 'SUPER_ADMIN', name: 'Super Admin', description: 'Platform super administrator' },
];

/** Easy local/VPS test accounts — email/password only (no OAuth). */
const TEST_USERS: Array<{
  email: string;
  password: string;
  displayName: string;
  roleCodes: string[];
}> = [
  {
    email: 'customer@test.inabiya',
    password: 'Password123!',
    displayName: 'Test Customer',
    roleCodes: ['CUSTOMER'],
  },
  {
    email: 'commerce@test.inabiya',
    password: 'Password123!',
    displayName: 'Test Commerce Admin',
    roleCodes: ['COMMERCE_ADMIN'],
  },
  {
    email: 'writer@test.inabiya',
    password: 'Password123!',
    displayName: 'Test Writer',
    roleCodes: ['WRITER'],
  },
  {
    email: 'content@test.inabiya',
    password: 'Password123!',
    displayName: 'Test Content Admin',
    roleCodes: ['CONTENT_ADMIN'],
  },
  {
    email: 'seo@test.inabiya',
    password: 'Password123!',
    displayName: 'Test SEO Editor',
    roleCodes: ['SEO_EDITOR'],
  },
  {
    email: 'medical@test.inabiya',
    password: 'Password123!',
    displayName: 'Test Medical Reviewer',
    roleCodes: ['MEDICAL_REVIEWER'],
  },
  {
    email: 'finance@test.inabiya',
    password: 'Password123!',
    displayName: 'Test Finance',
    roleCodes: ['FINANCE'],
  },
  {
    email: 'support@test.inabiya',
    password: 'Password123!',
    displayName: 'Test Support',
    roleCodes: ['SUPPORT'],
  },
  {
    email: 'brand@test.inabiya',
    password: 'Password123!',
    displayName: 'Test Brand',
    roleCodes: ['BRAND'],
  },
  {
    email: 'creator@test.inabiya',
    password: 'Password123!',
    displayName: 'Test Creator',
    roleCodes: ['CREATOR'],
  },
  {
    email: 'super@test.inabiya',
    password: 'Password123!',
    displayName: 'Test Super Admin',
    roleCodes: ['SUPER_ADMIN'],
  },
];

async function main() {
  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: { name: role.name, description: role.description },
      create: role,
    });
  }
  console.log(`Seeded ${ROLES.length} baseline roles`);

  for (const tu of TEST_USERS) {
    const passwordHash = await bcrypt.hash(tu.password, 10);
    const user = await prisma.user.upsert({
      where: { email: tu.email },
      update: {
        passwordHash,
        displayName: tu.displayName,
        isActive: true,
      },
      create: {
        email: tu.email,
        passwordHash,
        displayName: tu.displayName,
      },
    });

    for (const code of tu.roleCodes) {
      const role = await prisma.role.findUniqueOrThrow({ where: { code } });
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: role.id } },
        update: {},
        create: { userId: user.id, roleId: role.id },
      });
    }
    console.log(`Seeded user ${tu.email} → ${tu.roleCodes.join(',')}`);
  }

  const categories = [
    { slug: 'newborn', name: 'Newborn', description: 'Welcome baby essentials', sortOrder: 1 },
    { slug: 'keepsakes', name: 'Keepsakes', description: 'Memory makers', sortOrder: 2 },
    { slug: 'clothing', name: 'Clothing', description: 'Soft wear for tiny humans', sortOrder: 3 },
    { slug: 'bath-skin', name: 'Bath & Skin', description: 'Gentle care', sortOrder: 4 },
    { slug: 'toys', name: 'Toys', description: 'Playful gifts', sortOrder: 5 },
    { slug: 'mom-care', name: 'Mom Care', description: 'For expecting & new moms', sortOrder: 6 },
  ];
  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description, sortOrder: c.sortOrder },
      create: c,
    });
  }
  console.log(`Seeded ${categories.length} categories`);

  const newborn = await prisma.category.findUniqueOrThrow({ where: { slug: 'newborn' } });
  const keepsakes = await prisma.category.findUniqueOrThrow({ where: { slug: 'keepsakes' } });
  const clothing = await prisma.category.findUniqueOrThrow({ where: { slug: 'clothing' } });
  const toys = await prisma.category.findUniqueOrThrow({ where: { slug: 'toys' } });
  const momCare = await prisma.category.findUniqueOrThrow({ where: { slug: 'mom-care' } });

  // Unsplash demo media — IDs verified HTTP 200 (photo-1515488042361… is 404).
  const demoProducts = [
    {
      slug: 'cloud-soft-swaddle',
      title: 'Cloud Soft Swaddle',
      description: 'Breathable muslin swaddle for sleepy newborns.',
      sku: 'SWAD-001',
      label: 'Standard',
      pricePaise: 129900,
      onHand: 25,
      categoryId: newborn.id,
      imageUrl: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=800',
      recipientTags: ['girl', 'boy', 'unisex'],
      ageBands: ['newborn'],
      occasionTags: ['welcome-baby'],
      isReadyMadeHamper: false,
      brandName: 'Soft Nest',
      storefrontLabels: ['EDITORS_PICK'],
    },
    {
      slug: 'personalised-name-blanket',
      title: 'Personalised Name Blanket',
      description: 'Cosy fleece blanket with embroidered baby name.',
      sku: 'BLNK-001',
      label: 'Default',
      pricePaise: 249900,
      compareAtPricePaise: 499800,
      onHand: 15,
      categoryId: keepsakes.id,
      imageUrl: 'https://inabiya.edunexservices.in/gift/media/personalised-name-blanket.webp',
      recipientTags: ['girl', 'unisex'],
      ageBands: ['newborn', 'infant'],
      occasionTags: ['welcome-baby', 'naming'],
      isReadyMadeHamper: false,
      brandName: 'Mamaearth',
      storefrontLabels: ['BESTSELLER'],
    },
    {
      slug: 'wooden-rattle-set',
      title: 'Wooden Rattle Set',
      description: 'Natural wood rattles — gift box friendly.',
      sku: 'RATT-001',
      label: 'Set of 3',
      pricePaise: 89900,
      onHand: 4,
      categoryId: toys.id,
      imageUrl: 'https://inabiya.edunexservices.in/gift/media/wooden-rattle-set.webp',
      recipientTags: ['boy', 'unisex'],
      ageBands: ['infant', 'toddler'],
      occasionTags: ['birthday', 'welcome-baby'],
      isReadyMadeHamper: false,
      brandName: 'Chicco',
      storefrontLabels: [] as string[],
    },
    {
      slug: 'welcome-baby-hamper',
      title: 'Welcome Baby Hamper',
      description: 'Ready-made hamper: swaddle, rattle & keepsake card.',
      sku: 'HAMP-001',
      label: 'Classic',
      pricePaise: 399900,
      onHand: 12,
      categoryId: newborn.id,
      imageUrl: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800',
      recipientTags: ['girl', 'boy', 'unisex'],
      ageBands: ['newborn'],
      occasionTags: ['welcome-baby', 'baby-shower'],
      isReadyMadeHamper: true,
      brandName: 'Inabiya',
      storefrontLabels: ['GIFT_SET'],
      extraCategoryIds: [clothing.id],
    },
    {
      slug: 'expecting-mom-calm-kit',
      title: 'Expecting Mom Calm Kit',
      description: 'Gentle self-care set for the third trimester.',
      sku: 'MOM-001',
      label: 'Kit',
      pricePaise: 179900,
      onHand: 20,
      categoryId: momCare.id,
      imageUrl: 'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=800',
      recipientTags: ['mom'],
      ageBands: ['any'],
      occasionTags: ['baby-shower'],
      isReadyMadeHamper: true,
      brandName: 'The Moms Co.',
      storefrontLabels: [] as string[],
    },
  ];

  for (const dp of demoProducts) {
    const product = await prisma.product.upsert({
      where: { slug: dp.slug },
      update: {
        title: dp.title,
        description: dp.description,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        recipientTags: dp.recipientTags,
        ageBands: dp.ageBands,
        occasionTags: dp.occasionTags,
        isReadyMadeHamper: dp.isReadyMadeHamper,
        brandName: dp.brandName,
        storefrontLabels: dp.storefrontLabels ?? [],
      },
      create: {
        slug: dp.slug,
        title: dp.title,
        description: dp.description,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        recipientTags: dp.recipientTags,
        ageBands: dp.ageBands,
        occasionTags: dp.occasionTags,
        isReadyMadeHamper: dp.isReadyMadeHamper,
        brandName: dp.brandName,
        storefrontLabels: dp.storefrontLabels ?? [],
      },
    });

    await prisma.productCategory.upsert({
      where: { productId_categoryId: { productId: product.id, categoryId: dp.categoryId } },
      update: {},
      create: { productId: product.id, categoryId: dp.categoryId },
    });
    for (const extraId of dp.extraCategoryIds ?? []) {
      await prisma.productCategory.upsert({
        where: { productId_categoryId: { productId: product.id, categoryId: extraId } },
        update: {},
        create: { productId: product.id, categoryId: extraId },
      });
    }

    const variant = await prisma.productVariant.upsert({
      where: { sku: dp.sku },
      update: {
        label: dp.label,
        pricePaise: dp.pricePaise,
        compareAtPricePaise: dp.compareAtPricePaise ?? null,
        giftBoxEligible: true,
      },
      create: {
        productId: product.id,
        sku: dp.sku,
        label: dp.label,
        pricePaise: dp.pricePaise,
        compareAtPricePaise: dp.compareAtPricePaise ?? null,
        giftBoxEligible: true,
      },
    });

    await prisma.inventoryItem.upsert({
      where: { variantId: variant.id },
      update: { onHand: dp.onHand },
      create: { variantId: variant.id, onHand: dp.onHand },
    });

    const primaryMedia = await prisma.productMedia.findFirst({
      where: { productId: product.id },
      orderBy: { sortOrder: 'asc' },
    });
    if (primaryMedia) {
      await prisma.productMedia.update({
        where: { id: primaryMedia.id },
        data: { url: dp.imageUrl, altText: dp.title },
      });
    } else {
      await prisma.productMedia.create({
        data: { productId: product.id, url: dp.imageUrl, altText: dp.title },
      });
    }

    await prisma.personalizationOption.upsert({
      where: { productId_key: { productId: product.id, key: 'babyName' } },
      update: { label: 'Baby name', type: 'TEXT', maxLength: 24, required: false },
      create: {
        productId: product.id,
        key: 'babyName',
        label: 'Baby name',
        type: 'TEXT',
        maxLength: 24,
        required: false,
      },
    });

    console.log(`Seeded product ${dp.slug}`);
  }

  await prisma.commerceSetting.upsert({
    where: { key: 'homepage.featured_slugs' },
    update: {
      value: [
        'cloud-soft-swaddle',
        'personalised-name-blanket',
        'wooden-rattle-set',
        'welcome-baby-hamper',
      ],
    },
    create: {
      key: 'homepage.featured_slugs',
      value: [
        'cloud-soft-swaddle',
        'personalised-name-blanket',
        'wooden-rattle-set',
        'welcome-baby-hamper',
      ],
    },
  });
  console.log('Seeded homepage featured products');

  const featuredSlugs = [
    'cloud-soft-swaddle',
    'personalised-name-blanket',
    'wooden-rattle-set',
    'welcome-baby-hamper',
  ];

  const homeBlocks = [
    {
      type: 'hero',
      sortOrder: 0,
      props: {
        variant: 'storefront',
        eyebrow: 'Personalised baby gifting',
        headline: 'Little bundles of joy, thoughtfully chosen.',
        subcopy:
          'Build a bespoke baby box in gentle steps — or pick a ready-made hamper. Packed with warmth, shipped across India.',
        ctaLabel: 'Build Your Box',
        ctaHref: '/gift/build-your-box',
        ctaLabel2: 'Browse Hampers',
        ctaHref2: '/gift/products?hamper=1',
        trustLine: 'Baby-safe brands · Free shipping over ₹2,000 · Curated for new parents',
        imageUrl: 'https://images.unsplash.com/photo-1635874714425-c342060a4c58?w=900&q=85',
      },
    },
    {
      type: 'brandStrip',
      sortOrder: 1,
      props: {
        title: 'Trusted brands we stock',
        subtitle: 'Curated partners for gentle, baby-safe gifting',
        showUsps: true,
        usps: [
          { icon: 'heart', label: 'Personalised with care' },
          { icon: 'package', label: 'Ready-made hampers' },
          { icon: 'gift', label: 'Baby-safe picks' },
          { icon: 'truck', label: 'Pan-India shipping' },
        ],
        brands: [
          { name: 'The Moms Co.', logoUrl: '/gift/brands/the-moms-co.svg' },
          { name: 'Inabiya', logoUrl: '/gift/brands/inabiya.svg' },
          { name: 'Chicco', logoUrl: '/gift/brands/chicco.svg' },
          { name: 'Mamaearth', logoUrl: '/gift/brands/mamaearth.svg' },
          { name: 'Soft Nest', logoUrl: '/gift/brands/soft-nest.svg' },
        ],
      },
    },
    {
      type: 'saleStrip',
      sortOrder: 2,
      props: {
        text: 'Free shipping over ₹2,000 · this week',
        ctaLabel: 'Shop gifts',
        ctaHref: '/gift/products',
        tone: 'mint',
      },
    },
    {
      type: 'recipientSplit',
      sortOrder: 3,
      props: {
        title: 'Shop by baby',
        subtitle: 'Soft palettes for little ones — unisex-safe picks are woven into both.',
        left: {
          label: 'girl',
          href: '/gift/products?recipient=girl',
          eyebrow: 'For the little',
          blurb: 'Blush tones, keepsakes, and gentle firsts.',
          cta: 'Shop girl gifts →',
          accent: 'pink',
          imageUrl: 'https://images.unsplash.com/photo-1519689373023-dd07c809edd0?w=900&q=80',
          imageAlt: 'Shop gifts for girl',
        },
        right: {
          label: 'boy',
          href: '/gift/products?recipient=boy',
          eyebrow: 'For the little',
          blurb: 'Sky hues, playful toys, and everyday comfort.',
          cta: 'Shop boy gifts →',
          accent: 'sky',
          imageUrl: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=900&q=80',
          imageAlt: 'Shop gifts for boy',
        },
      },
    },
    {
      type: 'discoveryChips',
      sortOrder: 4,
      props: {
        overline: 'Discover',
        title: 'Shop by moment',
        subtitle: 'Jump into age bands and occasions — filters open on the gift shop.',
        items: [
          { label: 'Newborn', href: '/gift/products?age=newborn' },
          { label: 'Infant', href: '/gift/products?age=infant' },
          { label: 'Naming', href: '/gift/products?occasion=naming' },
          { label: 'Baby shower', href: '/gift/products?occasion=baby-shower' },
          { label: 'Birthday', href: '/gift/products?occasion=birthday' },
        ],
      },
    },
    {
      type: 'buildYourBoxTeaser',
      sortOrder: 5,
      props: {
        overline: 'Personalised',
        title: 'Build Your Box',
        body: 'A gentle wizard — pick who it’s for, then age, occasion, and budget. We help you fill a thoughtful gift.',
        ctaLabel: 'Build your box',
        ctaHref: '/gift/build-your-box',
        steps: [
          { title: 'Who it’s for', body: 'Girl, boy, mom, or unisex-safe picks.' },
          { title: 'Age & occasion', body: 'Newborn through toddler — naming, shower, birthday.' },
          {
            title: 'Budget & picks',
            body: 'Stay on budget while we suggest gift-box eligible items.',
          },
        ],
      },
    },
    {
      type: 'productGrid',
      sortOrder: 6,
      props: {
        overline: 'Hampers',
        title: 'Ready-made hampers',
        subtitle: 'Complete boxes, ready to wrap — less planning, more delight.',
        hamper: true,
        limit: 3,
        seeAllHref: '/gift/products?hamper=1',
        seeAllLabel: 'Browse all hampers',
      },
    },
    {
      type: 'productGrid',
      sortOrder: 7,
      props: {
        overline: 'Favourites',
        title: 'Featured gifts',
        subtitle: 'Hand-picked favourites parents keep coming back for.',
        productSlugs: featuredSlugs,
        seeAllHref: '/gift/products',
        seeAllLabel: 'Shop all gifts',
      },
    },
    {
      type: 'cta',
      sortOrder: 8,
      props: {
        title: 'Corporate & bulk gifting',
        body: 'Teams and events — share quantity and occasion; we will reply with pricing.',
        label: 'Get a quote',
        href: '/gift/corporate',
      },
    },
    {
      type: 'articleTeasers',
      sortOrder: 9,
      props: {
        overline: 'Journal',
        title: 'From the parenting journal',
        subtitle: 'Gentle reads from specialists — gifting, newborn care, and early parenthood.',
        limit: 3,
        seeAllHref: '/articles',
        seeAllLabel: 'All articles →',
      },
    },
    {
      type: 'faq',
      sortOrder: 10,
      props: {
        title: 'Frequently asked questions',
        items: [
          {
            question: 'How long does shipping take?',
            answerHtml:
              '<p>We prepare Soft Gift orders carefully. Standard delivery timing is confirmed at checkout for your pincode.</p>',
          },
          {
            question: 'Can I personalise my gift?',
            answerHtml:
              '<p>Many products support personalisation (like a baby name). Toggle it on the product page before adding to cart.</p>',
          },
          {
            question: 'What is your return window?',
            answerHtml:
              '<p>Returns open for 14 days after delivery. Personalised items may have limited return eligibility.</p>',
          },
        ],
      },
    },
  ];

  const existingHome = await prisma.marketingPage.findUnique({ where: { slug: 'home' } });
  if (existingHome) {
    await prisma.pageBlock.deleteMany({ where: { pageId: existingHome.id } });
    await prisma.marketingPage.update({
      where: { id: existingHome.id },
      data: {
        title: 'Soft Gift homepage',
        seoTitle: 'Inabiya Soft Gift',
        seoDescription: 'Thoughtfully personalised baby essentials & gifting.',
        canonicalPath: '/gift',
        robotsIndex: true,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        blocks: {
          create: homeBlocks.map((b) => ({
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
        slug: 'home',
        title: 'Soft Gift homepage',
        seoTitle: 'Inabiya Soft Gift',
        seoDescription: 'Thoughtfully personalised baby essentials & gifting.',
        canonicalPath: '/gift',
        robotsIndex: true,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        blocks: {
          create: homeBlocks.map((b) => ({
            type: b.type,
            sortOrder: b.sortOrder,
            props: b.props,
          })),
        },
      },
    });
  }
  console.log('Seeded Soft Gift homepage MarketingPage (slug=home)');

  await prisma.commerceSetting.upsert({
    where: { key: 'gift.chrome' },
    update: {
      value: {
        shopLinks: [
          { href: '/gift/build-your-box', label: 'Build Your Box' },
          { href: '/gift/products?hamper=1', label: 'Ready-Made Hampers' },
          { href: '/gift/products?category=clothing', label: 'Clothing' },
          { href: '/gift/products?category=bath-skin', label: 'Bath & Skin' },
          { href: '/gift/products?category=toys', label: 'Toys' },
          { href: '/gift/products?category=mom-care', label: 'Mom Care' },
          { href: '/gift/products?category=keepsakes', label: 'Keepsakes' },
        ],
        forWhomLinks: [
          { href: '/gift/products?recipient=girl', label: 'Baby Girl' },
          { href: '/gift/products?recipient=boy', label: 'Baby Boy' },
          { href: '/gift/products?recipient=mom', label: 'Expecting Mom' },
          { href: '/gift/products?age=newborn', label: 'Newborn' },
          { href: '/gift/products?age=infant', label: 'Infant' },
          { href: '/gift/products?age=toddler', label: 'Toddler' },
        ],
        footer: {
          brandName: 'Inabiya',
          tagline: 'Thoughtfully personalised baby essentials & gifting.',
          showNewsletter: true,
          socialLinks: [
            { label: 'Instagram', href: 'https://instagram.com/inabiya', network: 'instagram' },
            { label: 'Facebook', href: 'https://facebook.com/inabiya', network: 'facebook' },
            { label: 'WhatsApp', href: 'https://wa.me/919693940330', network: 'whatsapp' },
          ],
          columns: [
            {
              title: 'Shop',
              links: [
                { label: 'Build Your Box', href: '/gift/build-your-box' },
                { label: 'Ready-Made Hampers', href: '/gift/products?hamper=1' },
                { label: 'Shop by Age', href: '/gift/products?age=newborn' },
                { label: 'Corporate Gifting', href: '/gift/corporate' },
              ],
            },
            {
              title: 'Help',
              links: [
                { label: 'Shipping', href: '/gift#faq' },
                { label: 'Returns', href: '/gift#faq' },
                { label: 'FAQ', href: '/gift#faq' },
                { label: 'WhatsApp', href: 'https://wa.me/919693940330' },
              ],
            },
            {
              title: 'Company',
              links: [
                { label: 'About', href: '/about' },
                { label: 'Contact', href: '/contact' },
                { label: 'Parenting Blog', href: '/articles' },
                { label: 'Our Specialists', href: '/specialists' },
              ],
            },
          ],
        },
      },
    },
    create: {
      key: 'gift.chrome',
      value: {
        shopLinks: [
          { href: '/gift/build-your-box', label: 'Build Your Box' },
          { href: '/gift/products?hamper=1', label: 'Ready-Made Hampers' },
          { href: '/gift/products?category=clothing', label: 'Clothing' },
          { href: '/gift/products?category=bath-skin', label: 'Bath & Skin' },
          { href: '/gift/products?category=toys', label: 'Toys' },
          { href: '/gift/products?category=mom-care', label: 'Mom Care' },
          { href: '/gift/products?category=keepsakes', label: 'Keepsakes' },
        ],
        forWhomLinks: [
          { href: '/gift/products?recipient=girl', label: 'Baby Girl' },
          { href: '/gift/products?recipient=boy', label: 'Baby Boy' },
          { href: '/gift/products?recipient=mom', label: 'Expecting Mom' },
          { href: '/gift/products?age=newborn', label: 'Newborn' },
          { href: '/gift/products?age=infant', label: 'Infant' },
          { href: '/gift/products?age=toddler', label: 'Toddler' },
        ],
        footer: {
          brandName: 'Inabiya',
          tagline: 'Thoughtfully personalised baby essentials & gifting.',
          showNewsletter: true,
          socialLinks: [
            { label: 'Instagram', href: 'https://instagram.com/inabiya', network: 'instagram' },
            { label: 'Facebook', href: 'https://facebook.com/inabiya', network: 'facebook' },
            { label: 'WhatsApp', href: 'https://wa.me/919693940330', network: 'whatsapp' },
          ],
          columns: [
            {
              title: 'Shop',
              links: [
                { label: 'Build Your Box', href: '/gift/build-your-box' },
                { label: 'Ready-Made Hampers', href: '/gift/products?hamper=1' },
                { label: 'Shop by Age', href: '/gift/products?age=newborn' },
                { label: 'Corporate Gifting', href: '/gift/corporate' },
              ],
            },
            {
              title: 'Help',
              links: [
                { label: 'Shipping', href: '/gift#faq' },
                { label: 'Returns', href: '/gift#faq' },
                { label: 'FAQ', href: '/gift#faq' },
                { label: 'WhatsApp', href: 'https://wa.me/919693940330' },
              ],
            },
            {
              title: 'Company',
              links: [
                { label: 'About', href: '/about' },
                { label: 'Contact', href: '/contact' },
                { label: 'Parenting Blog', href: '/articles' },
                { label: 'Our Specialists', href: '/specialists' },
              ],
            },
          ],
        },
      },
    },
  });
  console.log('Seeded gift.chrome setting (defaults)');

  const corporateBlocks = [
    {
      type: 'hero',
      sortOrder: 0,
      props: {
        variant: 'panel',
        headline: 'Corporate & bulk gifting',
        subcopy:
          'Teams and events — share quantity and occasion; we will reply with pricing. Inquiry form below.',
        ctaLabel: 'Back to shop',
        ctaHref: '/gift',
      },
    },
  ];
  const existingCorporate = await prisma.marketingPage.findUnique({
    where: { slug: 'corporate-gifting' },
  });
  if (existingCorporate) {
    await prisma.pageBlock.deleteMany({ where: { pageId: existingCorporate.id } });
    await prisma.marketingPage.update({
      where: { id: existingCorporate.id },
      data: {
        title: 'Corporate & bulk gifting',
        status: 'PUBLISHED',
        publishedAt: new Date(),
        blocks: {
          create: corporateBlocks.map((b) => ({
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
        slug: 'corporate-gifting',
        title: 'Corporate & bulk gifting',
        status: 'PUBLISHED',
        publishedAt: new Date(),
        blocks: {
          create: corporateBlocks.map((b) => ({
            type: b.type,
            sortOrder: b.sortOrder,
            props: b.props,
          })),
        },
      },
    });
  }
  console.log('Seeded MarketingPage slug=corporate-gifting');

  const coupons = [
    {
      code: 'WELCOME10',
      description: '10% off welcome offer',
      discountPercent: 10,
      minSubtotalPaise: 50_000,
    },
    {
      code: 'FLAT100',
      description: '₹100 off',
      discountPaise: 10_000,
      minSubtotalPaise: 100_000,
    },
  ];
  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: {
        description: c.description,
        discountPercent: c.discountPercent ?? null,
        discountPaise: c.discountPaise ?? null,
        minSubtotalPaise: c.minSubtotalPaise,
        active: true,
      },
      create: {
        code: c.code,
        description: c.description,
        discountPercent: c.discountPercent ?? null,
        discountPaise: c.discountPaise ?? null,
        minSubtotalPaise: c.minSubtotalPaise,
        active: true,
      },
    });
  }
  console.log(`Seeded ${coupons.length} coupons`);

  const editorialCategories = [
    {
      slug: 'newborn-care',
      name: 'Newborn Care',
      description: 'Trusted guidance for the first weeks',
    },
    {
      slug: 'gifting',
      name: 'Gifting',
      description: 'Thoughtful gift ideas and etiquette',
    },
  ];
  for (const c of editorialCategories) {
    await prisma.editorialCategory.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description },
      create: c,
    });
  }
  console.log(`Seeded ${editorialCategories.length} editorial categories`);

  await prisma.specialistProfile.upsert({
    where: { slug: 'dr-meera-sharma' },
    update: {
      name: 'Dr. Meera Sharma',
      title: 'Paediatrician',
      bio: 'Supports families with evidence-based newborn care guidance.',
      credentials: 'MBBS, DCH',
    },
    create: {
      slug: 'dr-meera-sharma',
      name: 'Dr. Meera Sharma',
      title: 'Paediatrician',
      bio: 'Supports families with evidence-based newborn care guidance.',
      credentials: 'MBBS, DCH',
    },
  });
  console.log('Seeded specialist dr-meera-sharma');

  const brandUser = await prisma.user.findUniqueOrThrow({
    where: { email: 'brand@test.inabiya' },
  });
  await prisma.brandProfile.upsert({
    where: { userId: brandUser.id },
    update: {
      slug: 'soft-nest-co',
      companyName: 'Soft Nest Co',
      bio: 'Parenting brand seeking authentic creators.',
    },
    create: {
      userId: brandUser.id,
      slug: 'soft-nest-co',
      companyName: 'Soft Nest Co',
      bio: 'Parenting brand seeking authentic creators.',
    },
  });

  const creatorUser = await prisma.user.findUniqueOrThrow({
    where: { email: 'creator@test.inabiya' },
  });
  await prisma.creatorProfile.upsert({
    where: { userId: creatorUser.id },
    update: {
      slug: 'anya-creates',
      displayName: 'Anya Creates',
      bio: 'Lifestyle creator focused on newborn routines.',
      niches: ['newborn', 'lifestyle'],
    },
    create: {
      userId: creatorUser.id,
      slug: 'anya-creates',
      displayName: 'Anya Creates',
      bio: 'Lifestyle creator focused on newborn routines.',
      niches: ['newborn', 'lifestyle'],
    },
  });
  console.log('Seeded brand@ + creator@ profiles');

  const FLAGS: Array<{ key: string; enabled: boolean; description: string }> = [
    {
      key: 'support.impersonation',
      enabled: false,
      description: 'Support user impersonation (disabled by default)',
    },
    {
      key: 'checkout.guest',
      enabled: true,
      description: 'Allow guest checkout path when wired',
    },
    {
      key: 'media.library',
      enabled: true,
      description: 'Admin media library MVP',
    },
  ];
  for (const flag of FLAGS) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: { description: flag.description },
      create: flag,
    });
  }
  console.log(`Seeded ${FLAGS.length} feature flags`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
