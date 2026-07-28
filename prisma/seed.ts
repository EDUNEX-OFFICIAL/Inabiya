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
  const bathSkin = await prisma.category.findUniqueOrThrow({ where: { slug: 'bath-skin' } });

  /** Curated Soft Gift media under /gift/media (verified relevant — avoid random Unsplash IDs). */
  const media = {
    clothes: '/gift/media/baby-clothes.jpg',
    blanket: '/gift/media/personalised-name-blanket.webp',
    rattle: '/gift/media/wooden-rattle-set.webp',
    girl: '/gift/media/baby-girl-soft.jpg',
      boy: '/gift/media/train-toy.jpg',
    cues: '/gift/media/baby-cues.jpg',
    train: '/gift/media/train-toy.jpg',
    hamper: '/gift/media/baby-soft-gift.jpg',
    mom: '/gift/media/baby-mom.jpg',
    feet: '/gift/media/baby-boy-soft.jpg',
    blocks: '/gift/media/baby-blocks.jpg',
  };

  const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

  const demoProducts: Array<{
    slug: string;
    title: string;
    description: string;
    sku: string;
    label: string;
    pricePaise: number;
    compareAtPricePaise?: number;
    onHand: number;
    categoryId: string;
    imageUrl: string;
    recipientTags: string[];
    ageBands: string[];
    occasionTags: string[];
    isReadyMadeHamper: boolean;
    brandName: string;
    storefrontLabels: string[];
    extraCategoryIds?: string[];
    publishedAt: Date;
  }> = [
    {
      slug: 'cloud-soft-swaddle',
      title: 'Cloud Soft Swaddle',
      description: 'Breathable muslin swaddle for sleepy newborns.',
      sku: 'SWAD-001',
      label: 'Standard',
      pricePaise: 129900,
      onHand: 25,
      categoryId: newborn.id,
      imageUrl: media.clothes,
      recipientTags: ['girl', 'boy', 'unisex'],
      ageBands: ['newborn'],
      occasionTags: ['welcome-baby'],
      isReadyMadeHamper: false,
      brandName: 'Soft Nest',
      storefrontLabels: ['EDITORS_PICK'],
      publishedAt: daysAgo(45),
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
      imageUrl: media.blanket,
      recipientTags: ['girl', 'unisex'],
      ageBands: ['newborn', 'infant'],
      occasionTags: ['welcome-baby', 'naming'],
      isReadyMadeHamper: false,
      brandName: 'Mamaearth',
      storefrontLabels: ['BESTSELLER'],
      publishedAt: daysAgo(60),
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
      imageUrl: media.rattle,
      recipientTags: ['boy', 'unisex'],
      ageBands: ['infant', 'toddler'],
      occasionTags: ['birthday', 'welcome-baby'],
      isReadyMadeHamper: false,
      brandName: 'Chicco',
      storefrontLabels: ['BESTSELLER'],
      publishedAt: daysAgo(40),
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
      imageUrl: media.hamper,
      recipientTags: ['girl', 'boy', 'unisex'],
      ageBands: ['newborn'],
      occasionTags: ['welcome-baby', 'baby-shower'],
      isReadyMadeHamper: true,
      brandName: 'Inabiya',
      storefrontLabels: ['GIFT_SET', 'BESTSELLER'],
      extraCategoryIds: [clothing.id],
      publishedAt: daysAgo(50),
    },
    {
      slug: 'expecting-mom-calm-kit',
      title: 'Expecting Mom Calm Kit',
      description: 'Gentle self-care set for the third trimester.',
      sku: 'MOM-001',
      label: 'Kit',
      pricePaise: 179900,
      compareAtPricePaise: 229900,
      onHand: 20,
      categoryId: momCare.id,
      imageUrl: media.mom,
      recipientTags: ['mom'],
      ageBands: ['any'],
      occasionTags: ['baby-shower'],
      isReadyMadeHamper: true,
      brandName: 'The Moms Co.',
      storefrontLabels: ['EDITORS_PICK'],
      publishedAt: daysAgo(20),
    },
    {
      slug: 'organic-cotton-bodysuit-set',
      title: 'Organic Cotton Bodysuit Set',
      description: 'Three soft bodysuits in gentle pastels.',
      sku: 'BODY-001',
      label: 'Set of 3',
      pricePaise: 159900,
      compareAtPricePaise: 199900,
      onHand: 30,
      categoryId: clothing.id,
      imageUrl: media.clothes,
      recipientTags: ['girl', 'boy', 'unisex'],
      ageBands: ['newborn', 'infant'],
      occasionTags: ['welcome-baby', 'baby-shower'],
      isReadyMadeHamper: false,
      brandName: 'Mothercare',
      storefrontLabels: ['BESTSELLER'],
      publishedAt: daysAgo(35),
    },
    {
      slug: 'moonlit-night-light',
      title: 'Moonlit Night Light',
      description: 'Soft glow night light for nurseries.',
      sku: 'LGHT-001',
      label: 'Default',
      pricePaise: 149900,
      onHand: 18,
      categoryId: keepsakes.id,
      imageUrl: media.cues,
      recipientTags: ['unisex'],
      ageBands: ['newborn', 'infant', 'toddler'],
      occasionTags: ['welcome-baby', 'birthday'],
      isReadyMadeHamper: false,
      brandName: 'Philips Avent',
      storefrontLabels: [],
      publishedAt: daysAgo(5),
    },
    {
      slug: 'lavender-bath-essentials',
      title: 'Lavender Bath Essentials',
      description: 'Gentle wash + lotion duo for bath time.',
      sku: 'BATH-001',
      label: 'Duo',
      pricePaise: 99900,
      compareAtPricePaise: 129900,
      onHand: 40,
      categoryId: bathSkin.id,
      imageUrl: media.hamper,
      recipientTags: ['girl', 'boy', 'unisex'],
      ageBands: ['newborn', 'infant'],
      occasionTags: ['welcome-baby', 'baby-shower'],
      isReadyMadeHamper: false,
      brandName: "Johnson’s Baby",
      storefrontLabels: ['BESTSELLER'],
      publishedAt: daysAgo(28),
    },
    {
      slug: 'stackable-wood-blocks',
      title: 'Stackable Wood Blocks',
      description: 'Natural wood stacking blocks for tiny hands.',
      sku: 'BLCK-001',
      label: '12 pcs',
      pricePaise: 119900,
      onHand: 22,
      categoryId: toys.id,
      imageUrl: media.blocks,
      recipientTags: ['boy', 'unisex'],
      ageBands: ['infant', 'toddler'],
      occasionTags: ['birthday'],
      isReadyMadeHamper: false,
      brandName: 'Chicco',
      storefrontLabels: [],
      publishedAt: daysAgo(3),
    },
    {
      slug: 'silk-soft-romper',
      title: 'Silk Soft Romper',
      description: 'Everyday romper with envelope neckline.',
      sku: 'ROMP-001',
      label: '0–3M',
      pricePaise: 109900,
      onHand: 16,
      categoryId: clothing.id,
      imageUrl: media.girl,
      recipientTags: ['girl'],
      ageBands: ['newborn', 'infant'],
      occasionTags: ['welcome-baby', 'naming'],
      isReadyMadeHamper: false,
      brandName: 'Baby Hug',
      storefrontLabels: ['EDITORS_PICK'],
      publishedAt: daysAgo(7),
    },
    {
      slug: 'milestone-memory-cards',
      title: 'Milestone Memory Cards',
      description: 'Photo cards to mark first-year moments.',
      sku: 'CARD-001',
      label: 'Deck',
      pricePaise: 79900,
      onHand: 35,
      categoryId: keepsakes.id,
      imageUrl: media.blanket,
      recipientTags: ['unisex'],
      ageBands: ['newborn', 'infant'],
      occasionTags: ['welcome-baby', 'naming'],
      isReadyMadeHamper: false,
      brandName: 'Inabiya',
      storefrontLabels: ['EDITORS_PICK'],
      publishedAt: daysAgo(12),
    },
    {
      slug: 'nursing-comfort-hamper',
      title: 'Nursing Comfort Hamper',
      description: 'Ready hamper for new moms — care oils, balm & tea.',
      sku: 'HAMP-002',
      label: 'Comfort',
      pricePaise: 349900,
      onHand: 10,
      categoryId: momCare.id,
      imageUrl: media.mom,
      recipientTags: ['mom'],
      ageBands: ['any'],
      occasionTags: ['baby-shower', 'welcome-baby'],
      isReadyMadeHamper: true,
      brandName: 'The Moms Co.',
      storefrontLabels: ['GIFT_SET'],
      publishedAt: daysAgo(15),
    },
    {
      slug: 'pastel-play-mat',
      title: 'Pastel Play Mat',
      description: 'Foldable foam mat for tummy time and play.',
      sku: 'MAT-001',
      label: 'Standard',
      pricePaise: 219900,
      compareAtPricePaise: 279900,
      onHand: 14,
      categoryId: newborn.id,
      imageUrl: media.train,
      recipientTags: ['girl', 'boy', 'unisex'],
      ageBands: ['newborn', 'infant'],
      occasionTags: ['welcome-baby', 'birthday'],
      isReadyMadeHamper: false,
      brandName: 'Mee Mee',
      storefrontLabels: [],
      publishedAt: daysAgo(2),
    },
    {
      slug: 'tiny-toes-booties',
      title: 'Tiny Toes Booties',
      description: 'Knit booties that stay on wriggly feet.',
      sku: 'BOOT-001',
      label: 'Pair',
      pricePaise: 59900,
      onHand: 50,
      categoryId: clothing.id,
      imageUrl: media.feet,
      recipientTags: ['girl', 'boy', 'unisex'],
      ageBands: ['newborn', 'infant'],
      occasionTags: ['welcome-baby', 'naming'],
      isReadyMadeHamper: false,
      brandName: 'Pigeon',
      storefrontLabels: ['BESTSELLER'],
      publishedAt: daysAgo(55),
    },
    {
      slug: 'celebrate-naming-hamper',
      title: 'Celebrate Naming Hamper',
      description: 'Keepsake-forward hamper for naming day.',
      sku: 'HAMP-003',
      label: 'Naming',
      pricePaise: 449900,
      onHand: 8,
      categoryId: keepsakes.id,
      imageUrl: media.hamper,
      recipientTags: ['girl', 'boy', 'unisex'],
      ageBands: ['newborn'],
      occasionTags: ['naming', 'welcome-baby'],
      isReadyMadeHamper: true,
      brandName: 'Inabiya',
      storefrontLabels: ['GIFT_SET', 'EDITORS_PICK'],
      extraCategoryIds: [newborn.id],
      publishedAt: daysAgo(8),
    },
  ];

  for (const dp of demoProducts) {
    const product = await prisma.product.upsert({
      where: { slug: dp.slug },
      update: {
        title: dp.title,
        description: dp.description,
        status: 'PUBLISHED',
        publishedAt: dp.publishedAt,
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
        publishedAt: dp.publishedAt,
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
        'personalised-name-blanket',
        'wooden-rattle-set',
        'organic-cotton-bodysuit-set',
        'welcome-baby-hamper',
        'tiny-toes-booties',
        'lavender-bath-essentials',
      ],
    },
    create: {
      key: 'homepage.featured_slugs',
      value: [
        'personalised-name-blanket',
        'wooden-rattle-set',
        'organic-cotton-bodysuit-set',
        'welcome-baby-hamper',
        'tiny-toes-booties',
        'lavender-bath-essentials',
      ],
    },
  });
  console.log('Seeded homepage featured products');

  const homeBlocks = [
    {
      type: 'hero',
      sortOrder: 0,
      props: {
        variant: 'storefront',
        eyebrow: 'Personalised baby gifting',
        headline: 'Little bundles of joy, thoughtfully chosen.',
        subcopy:
          'Build a bespoke baby box in six gentle steps, or pick one of our ready-made hampers. Every gift is packed with warmth and shipped across India.',
        ctaLabel: 'Build Your Box',
        ctaHref: '/gift/build-your-box',
        ctaLabel2: 'Browse Hampers',
        ctaHref2: '/gift/products?hamper=1',
        trustLine: 'Baby-safe brands · Free shipping over ₹2,000 · PAN-India delivery',
        imageUrl: media.hamper,
        accentWord: 'joy',
      },
    },
    {
      type: 'saleStrip',
      sortOrder: 1,
      props: {
        text: 'Free personalisation on gift boxes this week',
        ctaLabel: 'Shop bestsellers →',
        ctaHref: '/gift/products?storefrontLabel=BESTSELLER',
        tone: 'blush',
      },
    },
    {
      type: 'brandStrip',
      sortOrder: 2,
      props: {
        title: 'Trusted baby & kids brands we stock',
        showUsps: false,
        brands: [
          { name: 'Chicco', logoUrl: '/gift/brands/chicco.svg' },
          { name: "Johnson’s Baby" },
          { name: 'Mothercare' },
          { name: 'Pigeon' },
          { name: 'Himalaya' },
          { name: 'The Moms Co.', logoUrl: '/gift/brands/the-moms-co.svg' },
          { name: 'Mamaearth', logoUrl: '/gift/brands/mamaearth.svg' },
          { name: 'Pampers' },
          { name: 'Mee Mee' },
          { name: 'Sebamed' },
          { name: 'Cetaphil' },
          { name: 'Mother Sparsh' },
          { name: 'Baby Hug' },
          { name: 'Philips Avent' },
        ],
      },
    },
    {
      type: 'recipientSplit',
      sortOrder: 3,
      props: {
        title: 'Shop by baby',
        subtitle: 'Curated palettes, unisex-safe products.',
        left: {
          label: 'girl',
          href: '/gift/products?recipient=girl',
          eyebrow: 'For the little',
          blurb: 'Blush ribbons, gentle pastels, gender-neutral picks.',
          cta: 'Shop girl gifts →',
          accent: 'pink',
          imageUrl: media.girl,
          imageAlt: 'Baby girl with soft toys',
        },
        right: {
          label: 'boy',
          href: '/gift/products?recipient=boy',
          eyebrow: 'For the little',
          blurb: 'Sky ribbons, soft brights, gender-neutral picks.',
          cta: 'Shop boy gifts →',
          accent: 'sky',
          imageUrl: media.boy,
          imageAlt: 'Wooden train set for little boys',
        },
      },
    },
    {
      type: 'brandStrip',
      sortOrder: 4,
      props: {
        showUsps: true,
        usps: [
          {
            icon: 'gift',
            label: 'Personalised gifts',
            body: 'Baby name, gift note, ribbon & wrap.',
          },
          {
            icon: 'package',
            label: 'Ready-made hampers',
            body: 'Ready when you need them.',
          },
          {
            icon: 'heart',
            label: 'Made with love',
            body: 'From new-parent friendly brands.',
          },
          {
            icon: 'shield',
            label: 'Trusted quality',
            body: 'Baby-safe, tested, thoughtful.',
          },
        ],
      },
    },
    {
      type: 'productGrid',
      sortOrder: 5,
      props: {
        source: 'bestsellers',
        overline: 'Parents love these',
        title: 'Best sellers',
        subtitle: 'The gifts families reorder and recommend.',
        limit: 8,
        seeAllHref: '/gift/products?storefrontLabel=BESTSELLER',
        seeAllLabel: 'See all',
      },
    },
    {
      type: 'exclusiveOffers',
      sortOrder: 6,
      props: {
        overline: 'Limited-time benefits',
        title: 'Exclusive Offers for Every Occasion',
        cards: [
          {
            tag: 'Welcome Baby',
            title: 'Save 10%',
            subtitle: 'Welcome Baby',
            body: 'Celebrate every newborn with beautifully curated hampers, complimentary gift wrapping and a personalised message.',
            ctaLabel: 'Order Now',
            ctaHref: '/gift/products?hamper=1',
            tone: 'blush',
            icon: 'heart',
          },
          {
            tag: 'Corporate Gifting',
            title: 'Save up to 15%',
            subtitle: 'Corporate Gifting',
            body: 'Thoughtful welcome-baby gifts for your team with branded cards, bulk pricing and PAN-India delivery.',
            ctaLabel: 'Get a Quote',
            ctaHref: '/gift/corporate',
            tone: 'sky',
            icon: 'briefcase',
          },
          {
            tag: 'Bulk & Event Gifting',
            title: 'Save up to 20%',
            subtitle: 'Bulk & Event Gifting',
            body: 'Perfect for baby showers, naming ceremonies and celebrations with 20+ hampers.',
            ctaLabel: 'Get Bulk Pricing',
            ctaHref: '/gift/corporate',
            tone: 'lavender',
            icon: 'box',
          },
        ],
      },
    },
    {
      type: 'discoveryChips',
      sortOrder: 7,
      props: {
        title: 'Shop by category',
        seeAllHref: '/gift/products',
        seeAllLabel: 'See all',
        items: [
          {
            label: 'Clothing',
            href: '/gift/products?category=clothing',
            imageUrl: media.clothes,
            imageAlt: 'Baby clothing',
          },
          {
            label: 'Bath & Skin',
            href: '/gift/products?category=bath-skin',
            imageUrl: media.cues,
            imageAlt: 'Nursery bath and soft care',
          },
          {
            label: 'Toys',
            href: '/gift/products?category=toys',
            imageUrl: media.train,
            imageAlt: 'Wooden train toys',
          },
          {
            label: 'Mom Care',
            href: '/gift/products?category=mom-care',
            imageUrl: media.mom,
            imageAlt: 'Care gifts for new moms',
          },
          {
            label: 'Keepsakes',
            href: '/gift/products?category=keepsakes',
            imageUrl: media.blanket,
            imageAlt: 'Keepsakes',
          },
          {
            label: 'Newborn',
            href: '/gift/products?category=newborn',
            imageUrl: media.feet,
            imageAlt: 'Newborn essentials',
          },
        ],
      },
    },
    {
      type: 'productGrid',
      sortOrder: 8,
      props: {
        source: 'new',
        overline: 'Just landed',
        title: 'New arrivals',
        subtitle: 'Fresh finds for the nursery and the gift pile.',
        newWithinDays: 30,
        limit: 8,
        seeAllHref: '/gift/products?sort=newest',
        seeAllLabel: 'See all',
      },
    },
    {
      type: 'discoveryChips',
      sortOrder: 9,
      props: {
        title: 'Shop by occasion',
        seeAllHref: '/gift/products',
        seeAllLabel: 'See all',
        items: [
          {
            label: 'Welcome baby',
            href: '/gift/products?occasion=welcome-baby',
            imageUrl: media.feet,
            imageAlt: 'Welcome baby',
          },
          {
            label: 'Baby shower',
            href: '/gift/products?occasion=baby-shower',
            imageUrl: media.girl,
            imageAlt: 'Baby shower',
          },
          {
            label: 'Naming',
            href: '/gift/products?occasion=naming',
            imageUrl: media.blanket,
            imageAlt: 'Naming ceremony',
          },
          {
            label: 'Birthday',
            href: '/gift/products?occasion=birthday',
            imageUrl: media.train,
            imageAlt: 'Birthday',
          },
        ],
      },
    },
    {
      type: 'discoveryChips',
      sortOrder: 10,
      props: {
        title: 'Shop by age',
        seeAllHref: '/gift/products',
        seeAllLabel: 'See all',
        items: [
          {
            label: 'Newborn',
            href: '/gift/products?age=newborn',
            imageUrl: media.feet,
            imageAlt: 'Newborn',
          },
          {
            label: 'Infant',
            href: '/gift/products?age=infant',
            imageUrl: media.girl,
            imageAlt: 'Infant',
          },
          {
            label: 'Toddler',
            href: '/gift/products?age=toddler',
            imageUrl: media.train,
            imageAlt: 'Toddler',
          },
        ],
      },
    },
    {
      type: 'productGrid',
      sortOrder: 11,
      props: {
        source: 'on_sale',
        overline: 'Limited deals',
        title: 'On sale',
        subtitle: 'Thoughtful gifts with a little extra saving.',
        limit: 8,
        seeAllHref: '/gift/products?onSale=1',
        seeAllLabel: 'See all',
      },
    },
    {
      type: 'productGrid',
      sortOrder: 12,
      props: {
        source: 'editors',
        overline: 'Curated',
        title: "Editor's picks",
        subtitle: 'Hand-picked favourites from our gift desk.',
        limit: 6,
        seeAllHref: '/gift/products?storefrontLabel=EDITORS_PICK',
        seeAllLabel: 'See all',
      },
    },
    {
      type: 'productGrid',
      sortOrder: 13,
      props: {
        source: 'manual',
        overline: 'Trending',
        title: 'Trending this week',
        subtitle: 'What gifters are adding to boxes right now.',
        productSlugs: [
          'personalised-name-blanket',
          'wooden-rattle-set',
          'pastel-play-mat',
          'silk-soft-romper',
          'lavender-bath-essentials',
          'moonlit-night-light',
        ],
        limit: 6,
        seeAllHref: '/gift/products',
        seeAllLabel: 'Browse all',
      },
    },
    {
      type: 'buildYourBoxTeaser',
      sortOrder: 14,
      props: {
        overline: '6-step gift builder',
        title: 'Customise a box just for them.',
        body: 'Choose recipient, age, occasion, budget and categories — we curate a perfect box that never goes over budget.',
        ctaLabel: 'Build Your Box',
        ctaHref: '/gift/build-your-box',
        steps: [
          { title: 'Who is it for?', body: 'Girl, boy, mom, or unisex' },
          { title: 'Baby age', body: 'Newborn to toddler' },
          { title: 'Occasion', body: 'Shower, naming, birthday' },
          { title: 'Budget', body: 'Stay on budget' },
          { title: 'Categories', body: 'Clothing, toys, care' },
          { title: 'Your box', body: 'Review and checkout' },
        ],
      },
    },
    {
      type: 'productGrid',
      sortOrder: 15,
      props: {
        source: 'auto',
        overline: 'Hampers',
        title: 'Ready-made hampers',
        subtitle: 'Complete boxes, ready to wrap — less planning, more delight.',
        hamper: true,
        limit: 6,
        seeAllHref: '/gift/products?hamper=1',
        seeAllLabel: 'See all',
      },
    },
    {
      type: 'cta',
      sortOrder: 16,
      props: {
        title: 'Corporate & bulk gifting',
        body: 'Welcome-baby hampers for your team — branded cards, volume pricing, PAN-India delivery.',
        label: 'Get a corporate quote',
        href: '/gift/corporate',
        variant: 'primary',
      },
    },
    {
      type: 'testimonials',
      sortOrder: 17,
      props: {
        overline: 'Parent love',
        title: 'Loved by new parents across India',
        subtitle: 'Honest notes from recent gifts — personal, on-budget, and actually useful.',
        items: [
          {
            quote: 'The box felt personal in a way Amazon never could. My sister cried happy tears.',
            author: 'Anaya',
            role: 'Bengaluru',
            rating: 5,
          },
          {
            quote:
              'As a corporate gifter, Inabiya makes it feel human. Our team’s new-parent gift is sorted.',
            author: 'Rohan',
            role: 'HR Lead',
            rating: 5,
          },
          {
            quote: 'Loved that the builder respected my ₹1,499 budget. No upsell tricks.',
            author: 'Kavya',
            role: 'Mumbai',
            rating: 5,
          },
        ],
      },
    },
    {
      type: 'articleTeasers',
      sortOrder: 18,
      props: {
        overline: 'Journal',
        title: 'From the parenting journal',
        subtitle: 'Warm, honest reads from real parents & pediatric experts.',
        limit: 3,
        seeAllHref: '/articles',
        seeAllLabel: 'All articles →',
      },
    },
    {
      type: 'faq',
      sortOrder: 19,
      props: {
        title: 'Frequently asked questions',
        items: [
          {
            question: 'How long does shipping take?',
            answerHtml:
              '<p>We prepare orders carefully. Standard delivery timing is confirmed at checkout for your pincode.</p>',
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
        title: 'Inabiya homepage',
        seoTitle: 'Inabiya',
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
        title: 'Inabiya homepage',
        seoTitle: 'Inabiya',
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
  console.log('Seeded Inabiya homepage MarketingPage (slug=home)');

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
          tagline:
            'Thoughtfully personalised baby essentials & gifting for the tiny humans (and their moms) you love.',
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
          tagline:
            'Thoughtfully personalised baby essentials & gifting for the tiny humans (and their moms) you love.',
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
        ctaLabel: 'Request a quote',
        ctaHref: '#inquiry',
        ctaLabel2: 'Browse shop',
        ctaHref2: '/gift/products',
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
