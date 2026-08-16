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

  const seedCollections: Array<{
    slug: string;
    title: string;
    description: string;
    overline: string;
    heroImageUrl: string;
    heroImageAlt: string;
    accent: string;
    sortOrder: number;
    lockedLabel: string;
    relatedSlugs: string[];
    smartRules: {
      match: 'all' | 'any';
      conditions: Array<{ field: string; op: string; value: string }>;
    };
  }> = [
    {
      slug: 'for-baby-girl',
      title: 'Gifts for baby girl',
      description: 'Blush ribbons, gentle pastels, and unisex-safe picks for her.',
      overline: 'Shop by baby',
      heroImageUrl: '/gift/media/baby-girl-soft.jpg',
      heroImageAlt: 'Baby girl with soft toys',
      accent: 'pink',
      sortOrder: 1,
      lockedLabel: 'Baby girl',
      relatedSlugs: ['for-baby-boy', 'unisex-gifts', 'newborn'],
      smartRules: {
        match: 'all',
        conditions: [{ field: 'recipient', op: 'is', value: 'girl' }],
      },
    },
    {
      slug: 'for-baby-boy',
      title: 'Gifts for baby boy',
      description: 'Sky ribbons, soft brights, and unisex-safe picks for him.',
      overline: 'Shop by baby',
      heroImageUrl: '/gift/media/train-toy.jpg',
      heroImageAlt: 'Wooden train set for little boys',
      accent: 'sky',
      sortOrder: 2,
      lockedLabel: 'Baby boy',
      relatedSlugs: ['for-baby-girl', 'unisex-gifts', 'newborn'],
      smartRules: {
        match: 'all',
        conditions: [{ field: 'recipient', op: 'is', value: 'boy' }],
      },
    },
    {
      slug: 'for-expecting-mom',
      title: 'For expecting & new moms',
      description: 'Calm kits, care oils, and thoughtful gifts for her too.',
      overline: 'Shop by baby',
      heroImageUrl: '/gift/media/baby-mom.jpg',
      heroImageAlt: 'Care gifts for new moms',
      accent: 'neutral',
      sortOrder: 3,
      lockedLabel: 'Expecting mom',
      relatedSlugs: ['baby-shower', 'welcome-baby', 'ready-hampers'],
      smartRules: {
        match: 'all',
        conditions: [{ field: 'recipient', op: 'is', value: 'mom' }],
      },
    },
    {
      slug: 'unisex-gifts',
      title: 'Unisex baby gifts',
      description: 'Gender-neutral essentials that work for any little one.',
      overline: 'Shop by baby',
      heroImageUrl: '/gift/media/personalised-name-blanket.webp',
      heroImageAlt: 'Unisex baby keepsakes',
      accent: 'neutral',
      sortOrder: 4,
      lockedLabel: 'Unisex',
      relatedSlugs: ['for-baby-girl', 'for-baby-boy', 'newborn'],
      smartRules: {
        match: 'all',
        conditions: [{ field: 'recipient', op: 'is', value: 'unisex' }],
      },
    },
    {
      slug: 'welcome-baby',
      title: 'Welcome baby gifts',
      description: 'First-hello hampers and soft essentials for the newborn days.',
      overline: 'Shop by occasion',
      heroImageUrl: '/gift/media/baby-boy-soft.jpg',
      heroImageAlt: 'Welcome baby',
      accent: 'pink',
      sortOrder: 5,
      lockedLabel: 'Welcome baby',
      relatedSlugs: ['baby-shower', 'newborn', 'ready-hampers'],
      smartRules: {
        match: 'all',
        conditions: [{ field: 'occasion', op: 'is', value: 'welcome-baby' }],
      },
    },
    {
      slug: 'baby-shower',
      title: 'Baby shower gifts',
      description: 'Celebrate the bump with ready-to-gift sets and keepsakes.',
      overline: 'Shop by occasion',
      heroImageUrl: '/gift/media/baby-girl-soft.jpg',
      heroImageAlt: 'Baby shower',
      accent: 'pink',
      sortOrder: 6,
      lockedLabel: 'Baby shower',
      relatedSlugs: ['welcome-baby', 'for-expecting-mom', 'naming-ceremony'],
      smartRules: {
        match: 'all',
        conditions: [{ field: 'occasion', op: 'is', value: 'baby-shower' }],
      },
    },
    {
      slug: 'naming-ceremony',
      title: 'Naming ceremony gifts',
      description: 'Personalised blankets, memory cards, and celebration-ready picks.',
      overline: 'Shop by occasion',
      heroImageUrl: '/gift/media/personalised-name-blanket.webp',
      heroImageAlt: 'Naming ceremony',
      accent: 'neutral',
      sortOrder: 7,
      lockedLabel: 'Naming',
      relatedSlugs: ['welcome-baby', 'first-birthday', 'unisex-gifts'],
      smartRules: {
        match: 'all',
        conditions: [{ field: 'occasion', op: 'is', value: 'naming' }],
      },
    },
    {
      slug: 'first-birthday',
      title: 'First birthday gifts',
      description: 'Toys, soft wear, and keepsakes for turning one.',
      overline: 'Shop by occasion',
      heroImageUrl: '/gift/media/train-toy.jpg',
      heroImageAlt: 'Birthday',
      accent: 'sky',
      sortOrder: 8,
      lockedLabel: 'Birthday',
      relatedSlugs: ['toddler', 'infant', 'bestsellers'],
      smartRules: {
        match: 'all',
        conditions: [{ field: 'occasion', op: 'is', value: 'birthday' }],
      },
    },
    {
      slug: 'newborn',
      title: 'Newborn essentials',
      description: 'Gentle, newborn-safe gifts for the first weeks.',
      overline: 'Shop by age',
      heroImageUrl: '/gift/media/baby-boy-soft.jpg',
      heroImageAlt: 'Newborn',
      accent: 'pink',
      sortOrder: 9,
      lockedLabel: 'Newborn',
      relatedSlugs: ['infant', 'welcome-baby', 'ready-hampers'],
      smartRules: {
        match: 'all',
        conditions: [{ field: 'age', op: 'is', value: 'newborn' }],
      },
    },
    {
      slug: 'infant',
      title: 'Infant gifts',
      description: 'Playful and practical picks for the infant months.',
      overline: 'Shop by age',
      heroImageUrl: '/gift/media/baby-girl-soft.jpg',
      heroImageAlt: 'Infant',
      accent: 'neutral',
      sortOrder: 10,
      lockedLabel: 'Infant',
      relatedSlugs: ['newborn', 'toddler', 'first-birthday'],
      smartRules: {
        match: 'all',
        conditions: [{ field: 'age', op: 'is', value: 'infant' }],
      },
    },
    {
      slug: 'toddler',
      title: 'Toddler gifts',
      description: 'Curious toys and soft wear for toddling explorers.',
      overline: 'Shop by age',
      heroImageUrl: '/gift/media/train-toy.jpg',
      heroImageAlt: 'Toddler',
      accent: 'sky',
      sortOrder: 11,
      lockedLabel: 'Toddler',
      relatedSlugs: ['infant', 'first-birthday', 'bestsellers'],
      smartRules: {
        match: 'all',
        conditions: [{ field: 'age', op: 'is', value: 'toddler' }],
      },
    },
    {
      slug: 'ready-hampers',
      title: 'Ready-made hampers',
      description: 'Pre-styled gift sets — ready when you need them.',
      overline: 'Curated',
      heroImageUrl: '/gift/media/baby-soft-gift.jpg',
      heroImageAlt: 'Ready-made hamper',
      accent: 'neutral',
      sortOrder: 12,
      lockedLabel: 'Hampers',
      relatedSlugs: ['bestsellers', 'welcome-baby', 'for-expecting-mom'],
      smartRules: {
        match: 'all',
        conditions: [{ field: 'hamper', op: 'is', value: 'yes' }],
      },
    },
    {
      slug: 'bestsellers',
      title: 'Best sellers',
      description: 'The gifts families reorder and recommend.',
      overline: 'Curated',
      heroImageUrl: '/gift/media/baby-cues.jpg',
      heroImageAlt: 'Best sellers',
      accent: 'pink',
      sortOrder: 13,
      lockedLabel: 'Best sellers',
      relatedSlugs: ['editors-picks', 'new-arrivals', 'ready-hampers'],
      smartRules: {
        match: 'all',
        conditions: [{ field: 'label', op: 'is', value: 'BESTSELLER' }],
      },
    },
    {
      slug: 'editors-picks',
      title: "Editor's picks",
      description: 'Hand-chosen favourites from the Soft Gift edit.',
      overline: 'Curated',
      heroImageUrl: '/gift/media/personalised-name-blanket.webp',
      heroImageAlt: "Editor's picks",
      accent: 'neutral',
      sortOrder: 14,
      lockedLabel: "Editor's picks",
      relatedSlugs: ['bestsellers', 'new-arrivals', 'unisex-gifts'],
      smartRules: {
        match: 'all',
        conditions: [{ field: 'label', op: 'is', value: 'EDITORS_PICK' }],
      },
    },
    {
      slug: 'new-arrivals',
      title: 'New arrivals',
      description: 'Fresh finds for the nursery and the gift pile.',
      overline: 'Curated',
      heroImageUrl: '/gift/media/baby-soft-gift.jpg',
      heroImageAlt: 'New arrivals',
      accent: 'sky',
      sortOrder: 15,
      lockedLabel: 'New arrivals',
      relatedSlugs: ['bestsellers', 'on-sale', 'ready-hampers'],
      smartRules: {
        match: 'all',
        conditions: [{ field: 'publishedWithinDays', op: 'within', value: '45' }],
      },
    },
    {
      slug: 'on-sale',
      title: 'On sale',
      description: 'Limited-time soft savings on thoughtful gifts.',
      overline: 'Curated',
      heroImageUrl: '/gift/media/baby-cues.jpg',
      heroImageAlt: 'On sale',
      accent: 'pink',
      sortOrder: 16,
      lockedLabel: 'On sale',
      relatedSlugs: ['bestsellers', 'ready-hampers', 'new-arrivals'],
      smartRules: {
        match: 'all',
        conditions: [{ field: 'onSale', op: 'is', value: 'yes' }],
      },
    },
  ];

  for (const c of seedCollections) {
    const row = await prisma.collection.upsert({
      where: { slug: c.slug },
      update: {
        title: c.title,
        description: c.description,
        overline: c.overline,
        heroImageUrl: c.heroImageUrl,
        heroImageAlt: c.heroImageAlt,
        accent: c.accent,
        sortOrder: c.sortOrder,
        status: 'PUBLISHED',
        membershipMode: 'SMART',
        smartRules: c.smartRules,
        relatedSlugs: c.relatedSlugs,
        lockedLabel: c.lockedLabel,
      },
      create: {
        slug: c.slug,
        title: c.title,
        description: c.description,
        overline: c.overline,
        heroImageUrl: c.heroImageUrl,
        heroImageAlt: c.heroImageAlt,
        accent: c.accent,
        sortOrder: c.sortOrder,
        status: 'PUBLISHED',
        membershipMode: 'SMART',
        smartRules: c.smartRules,
        relatedSlugs: c.relatedSlugs,
        lockedLabel: c.lockedLabel,
      },
    });
    // Smart collections do not keep manual joins
    await prisma.productCollection.deleteMany({ where: { collectionId: row.id } });
  }
  console.log(`Seeded ${seedCollections.length} Smart collections`);

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
    imageUrl: string;
    /** Extra gallery images (beyond primary imageUrl) for multi-thumb PDP demo. */
    galleryUrls?: string[];
    recipientTags: string[];
    ageBands: string[];
    occasionTags: string[];
    isReadyMadeHamper: boolean;
    brandName: string;
    storefrontLabels: string[];
    publishedAt: Date;
    hamperItems?: Array<{
      title: string;
      blurb?: string;
      brandName?: string;
      imageUrl: string;
      qty: number;
      unitPricePaise: number;
    }>;
    seoSections?: Array<{ heading: string; bodyText: string }>;
  }> = [
    {
      slug: 'cloud-soft-swaddle',
      title: 'Cloud Soft Swaddle',
      description: 'Breathable muslin swaddle for sleepy newborns.',
      sku: 'SWAD-001',
      label: 'Standard',
      pricePaise: 129900,
      onHand: 25,
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
      imageUrl: media.hamper,
      recipientTags: ['girl', 'boy', 'unisex'],
      ageBands: ['newborn'],
      occasionTags: ['welcome-baby', 'baby-shower'],
      isReadyMadeHamper: true,
      brandName: 'Inabiya',
      storefrontLabels: ['GIFT_SET', 'BESTSELLER'],
      publishedAt: daysAgo(50),
      hamperItems: [
        {
          title: 'Cloud Soft Swaddle',
          blurb: 'Breathable muslin wrap',
          brandName: 'Soft Nest',
          imageUrl: media.clothes,
          qty: 1,
          unitPricePaise: 149900,
        },
        {
          title: 'Wooden Rattle Set',
          blurb: 'Gentle first toy',
          brandName: 'Chicco',
          imageUrl: media.rattle,
          qty: 1,
          unitPricePaise: 129900,
        },
        {
          title: 'Milestone Memory Cards',
          blurb: 'Capture early moments',
          brandName: 'Inabiya',
          imageUrl: media.blanket,
          qty: 1,
          unitPricePaise: 99900,
        },
        {
          title: 'Keepsake note card',
          blurb: 'Handwritten-ready card',
          brandName: 'Inabiya',
          imageUrl: media.hamper,
          qty: 1,
          unitPricePaise: 49900,
        },
        {
          title: 'Soft cotton bib',
          blurb: 'Everyday feed-time essential',
          brandName: 'Mothercare',
          imageUrl: media.clothes,
          qty: 1,
          unitPricePaise: 39900,
        },
      ],
      seoSections: [
        {
          heading: 'Why choose this welcome hamper?',
          bodyText:
            'Everything a new parent needs in the first week — soft textiles, a calm toy, and a keepsake — gift-wrapped and ready to personalise.',
        },
        {
          heading: 'Who should buy it?',
          bodyText:
            'Perfect for friends, family, and corporate welcome-baby gifting when you want one polished set instead of shopping piece by piece.',
        },
      ],
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
      imageUrl: media.mom,
      recipientTags: ['mom'],
      ageBands: ['any'],
      occasionTags: ['baby-shower'],
      isReadyMadeHamper: true,
      brandName: 'The Moms Co.',
      storefrontLabels: ['EDITORS_PICK'],
      publishedAt: daysAgo(20),
      hamperItems: [
        {
          title: 'Calm belly oil',
          brandName: 'The Moms Co.',
          imageUrl: media.mom,
          qty: 1,
          unitPricePaise: 119900,
        },
        {
          title: 'Herbal wind-down tea',
          brandName: 'Organic India',
          imageUrl: media.cues,
          qty: 1,
          unitPricePaise: 79900,
        },
        {
          title: 'Soft lip balm',
          brandName: 'Mamaearth',
          imageUrl: media.mom,
          qty: 1,
          unitPricePaise: 49900,
        },
      ],
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
      imageUrl: media.hamper,
      galleryUrls: [media.cues, media.mom],
      recipientTags: ['girl', 'boy', 'unisex'],
      ageBands: ['newborn', 'infant'],
      occasionTags: ['welcome-baby', 'baby-shower'],
      isReadyMadeHamper: false,
      brandName: 'Johnson’s Baby',
      storefrontLabels: ['BESTSELLER'],
      publishedAt: daysAgo(28),
      seoSections: [
        {
          heading: '',
          bodyText:
            '<p>Gentle wash + lotion duo for bath time — curated Soft Gift quality, packed with care.</p><ul><li><strong>Gift-ready</strong> — packed with care for the people you love.</li><li><strong>Age range</strong> — perfectly sized for newborns (0–3 months) and infants.</li><li><strong>Personalise</strong> — add a name or note so the gift feels uniquely theirs.</li></ul>',
        },
      ],
    },
    {
      slug: 'stackable-wood-blocks',
      title: 'Stackable Wood Blocks',
      description: 'Natural wood stacking blocks for tiny hands.',
      sku: 'BLCK-001',
      label: '12 pcs',
      pricePaise: 119900,
      onHand: 22,
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
      imageUrl: media.mom,
      recipientTags: ['mom'],
      ageBands: ['any'],
      occasionTags: ['baby-shower', 'welcome-baby'],
      isReadyMadeHamper: true,
      brandName: 'The Moms Co.',
      storefrontLabels: ['GIFT_SET'],
      publishedAt: daysAgo(15),
      hamperItems: [
        {
          title: 'Belly care oil',
          blurb: 'Gentle stretch-mark care',
          brandName: 'The Moms Co.',
          imageUrl: media.mom,
          qty: 1,
          unitPricePaise: 129900,
        },
        {
          title: 'Recovery herbal tea',
          brandName: 'Organic India',
          imageUrl: media.cues,
          qty: 1,
          unitPricePaise: 79900,
        },
        {
          title: 'Nipple balm',
          brandName: 'Lansinoh',
          imageUrl: media.mom,
          qty: 1,
          unitPricePaise: 69900,
        },
        {
          title: 'Silk sleep mask',
          brandName: 'Inabiya',
          imageUrl: media.blanket,
          qty: 1,
          unitPricePaise: 99900,
        },
      ],
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
      imageUrl: media.hamper,
      recipientTags: ['girl', 'boy', 'unisex'],
      ageBands: ['newborn'],
      occasionTags: ['naming', 'welcome-baby'],
      isReadyMadeHamper: true,
      brandName: 'Inabiya',
      storefrontLabels: ['GIFT_SET', 'EDITORS_PICK'],
      publishedAt: daysAgo(8),
      hamperItems: [
        {
          title: 'Personalised Name Blanket',
          blurb: 'Soft keepsake with baby’s name',
          brandName: 'Soft Nest',
          imageUrl: media.blanket,
          qty: 1,
          unitPricePaise: 249900,
        },
        {
          title: 'Milestone Memory Cards',
          brandName: 'Inabiya',
          imageUrl: media.blanket,
          qty: 1,
          unitPricePaise: 99900,
        },
        {
          title: 'Wooden keepsake rattle',
          brandName: 'Chicco',
          imageUrl: media.rattle,
          qty: 1,
          unitPricePaise: 89900,
        },
        {
          title: 'Naming day card',
          brandName: 'Inabiya',
          imageUrl: media.hamper,
          qty: 1,
          unitPricePaise: 39900,
        },
      ],
      seoSections: [
        {
          heading: 'Why this naming hamper?',
          bodyText:
            'A keepsake-forward set for naming day — personalised textile, memory cards, and a gentle toy, ready to gift.',
        },
      ],
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
        seoSections: dp.seoSections ?? undefined,
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
        seoSections: dp.seoSections ?? undefined,
      },
    });

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
        data: { url: dp.imageUrl, altText: dp.title, kind: 'IMAGE', sortOrder: 0 },
      });
    } else {
      await prisma.productMedia.create({
        data: {
          productId: product.id,
          url: dp.imageUrl,
          altText: dp.title,
          kind: 'IMAGE',
          sortOrder: 0,
        },
      });
    }

    // Extra gallery images (multi-thumb PDP)
    if (dp.galleryUrls?.length) {
      const existing = await prisma.productMedia.findMany({
        where: { productId: product.id, kind: 'IMAGE' },
        orderBy: { sortOrder: 'asc' },
      });
      for (let i = 0; i < dp.galleryUrls.length; i++) {
        const url = dp.galleryUrls[i]!;
        const sortOrder = i + 1;
        const row = existing[i + 1];
        if (row) {
          await prisma.productMedia.update({
            where: { id: row.id },
            data: { url, altText: `${dp.title} ${sortOrder + 1}`, sortOrder },
          });
        } else {
          await prisma.productMedia.create({
            data: {
              productId: product.id,
              url,
              altText: `${dp.title} ${sortOrder + 1}`,
              kind: 'IMAGE',
              sortOrder,
            },
          });
        }
      }
    }

    // Demo unboxing video for welcome hamper PDP gallery
    if (dp.slug === 'welcome-baby-hamper') {
      const videoUrl = '/gift/media/welcome-hamper-unbox.mp4';
      const existingVideo = await prisma.productMedia.findFirst({
        where: { productId: product.id, kind: 'VIDEO' },
      });
      if (existingVideo) {
        await prisma.productMedia.update({
          where: { id: existingVideo.id },
          data: {
            url: videoUrl,
            posterUrl: dp.imageUrl,
            altText: `${dp.title} unboxing`,
            sortOrder: 1,
          },
        });
      } else {
        await prisma.productMedia.create({
          data: {
            productId: product.id,
            url: videoUrl,
            posterUrl: dp.imageUrl,
            altText: `${dp.title} unboxing`,
            kind: 'VIDEO',
            sortOrder: 1,
          },
        });
      }
    }

    if (dp.isReadyMadeHamper) {
      await prisma.productHamperItem.deleteMany({ where: { productId: product.id } });
      if (dp.hamperItems?.length) {
        await prisma.productHamperItem.createMany({
          data: dp.hamperItems.map((h, i) => ({
            productId: product.id,
            title: h.title,
            blurb: h.blurb ?? null,
            brandName: h.brandName ?? null,
            imageUrl: h.imageUrl,
            qty: h.qty,
            unitPricePaise: h.unitPricePaise,
            sortOrder: i,
          })),
        });
      }
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
        ctaHref2: '/gift/collections/ready-hampers',
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
        ctaHref: '/gift/collections/bestsellers',
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
          { name: 'Johnson’s Baby' },
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
          href: '/gift/collections/for-baby-girl',
          eyebrow: 'For the little',
          blurb: 'Blush ribbons, gentle pastels, gender-neutral picks.',
          cta: 'Shop girl gifts →',
          accent: 'pink',
          imageUrl: media.girl,
          imageAlt: 'Baby girl with soft toys',
        },
        right: {
          label: 'boy',
          href: '/gift/collections/for-baby-boy',
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
            body: 'Baby name, Gift note, Ribbon & wrap.',
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
            body: 'Baby-safe, Tested, Thoughtful.',
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
        seeAllHref: '/gift/collections/bestsellers',
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
            ctaHref: '/gift/collections/ready-hampers',
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
        title: 'Shop by collection',
        seeAllHref: '/gift/products',
        seeAllLabel: 'See all',
        limit: 4,
        itemsSource: 'catalogCollections',
        items: [
          {
            label: 'Clothing',
            href: '/gift/collections/for-baby-girl',
            imageUrl: media.clothes,
            imageAlt: 'Baby clothing',
          },
          {
            label: 'Bath & Skin',
            href: '/gift/collections/ready-hampers',
            imageUrl: media.cues,
            imageAlt: 'Nursery bath and soft care',
          },
          {
            label: 'Toys',
            href: '/gift/collections/first-birthday',
            imageUrl: media.train,
            imageAlt: 'Wooden train toys',
          },
          {
            label: 'Mom Care',
            href: '/gift/collections/for-expecting-mom',
            imageUrl: media.mom,
            imageAlt: 'Care gifts for new moms',
          },
          {
            label: 'Keepsakes',
            href: '/gift/collections/unisex-gifts',
            imageUrl: media.blanket,
            imageAlt: 'Keepsakes',
          },
          {
            label: 'Newborn',
            href: '/gift/collections/newborn',
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
        seeAllHref: '/gift/collections/new-arrivals',
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
            href: '/gift/collections/welcome-baby',
            imageUrl: media.feet,
            imageAlt: 'Welcome baby',
          },
          {
            label: 'Baby shower',
            href: '/gift/collections/baby-shower',
            imageUrl: media.girl,
            imageAlt: 'Baby shower',
          },
          {
            label: 'Naming',
            href: '/gift/collections/naming-ceremony',
            imageUrl: media.blanket,
            imageAlt: 'Naming ceremony',
          },
          {
            label: 'Birthday',
            href: '/gift/collections/first-birthday',
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
            href: '/gift/collections/newborn',
            imageUrl: media.feet,
            imageAlt: 'Newborn',
          },
          {
            label: 'Infant',
            href: '/gift/collections/infant',
            imageUrl: media.girl,
            imageAlt: 'Infant',
          },
          {
            label: 'Toddler',
            href: '/gift/collections/toddler',
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
        seeAllHref: '/gift/collections/on-sale',
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
        seeAllHref: '/gift/collections/editors-picks',
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
        seeAllHref: '/gift/collections/ready-hampers',
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
        ctaLabel: 'Shop gifts',
        ctaHref: '/gift/products',
        items: [
          {
            quote:
              'The box felt personal in a way Amazon never could. My sister cried happy tears.',
            author: 'Anaya',
            role: 'Bengaluru',
            rating: 5,
            dated: '2026-07-18',
          },
          {
            quote:
              'As a corporate gifter, Inabiya makes it feel human. Our team’s new-parent gift is sorted.',
            author: 'Rohan',
            role: 'HR Lead',
            rating: 5,
            dated: '2026-07-04',
          },
          {
            quote: 'Loved that the builder respected my ₹1,499 budget. No upsell tricks.',
            author: 'Kavya',
            role: 'Mumbai',
            rating: 5,
            dated: '2026-06-22',
          },
          {
            quote: 'The hamper arrived looking like it was wrapped by someone who actually cared.',
            author: 'Meera',
            role: 'Pune',
            rating: 5,
            dated: '2026-06-11',
          },
          {
            quote:
              'Picked a newborn box in ten minutes. My cousin said it felt expensive without being flashy.',
            author: 'Arjun',
            role: 'Delhi',
            rating: 5,
            dated: '2026-05-28',
          },
          {
            quote: 'Loved the mint-and-blush palette. It didn’t look like a generic hamper.',
            author: 'Nisha',
            role: 'Hyderabad',
            rating: 5,
            dated: '2026-05-14',
          },
          {
            quote:
              'Corporate gifting that still felt personal. We sent twenty boxes; every parent messaged us.',
            author: 'Vikram',
            role: 'Chennai',
            rating: 5,
            dated: '2026-04-30',
          },
          {
            quote: 'Build-your-box stayed inside my budget and still looked like a hug.',
            author: 'Diya',
            role: 'Kochi',
            rating: 5,
            dated: '2026-04-12',
          },
          {
            quote: 'The wrap, the note, the timing — it felt like we were in the room with them.',
            author: 'Priya',
            role: 'Ahmedabad',
            rating: 5,
            dated: '2026-03-26',
          },
          {
            quote: 'Reordered for my niece in one tap. Same care, no second-guessing the extras.',
            author: 'Sameer',
            role: 'Jaipur',
            rating: 5,
            dated: '2026-03-08',
          },
          {
            quote: 'Finally a gift that didn’t look like a catalogue dump. Soft, useful, loved.',
            author: 'Tara',
            role: 'Kolkata',
            rating: 5,
            dated: '2026-02-19',
          },
          {
            quote: 'HR asked for twenty welcome-baby boxes. Every parent sent a photo back.',
            author: 'Ishaan',
            role: 'Lucknow',
            rating: 5,
            dated: '2026-02-03',
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
        overline: 'Help',
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
          {
            question: 'Do you deliver across India?',
            answerHtml: '<p>Yes. Delivery timing is confirmed at checkout for your pincode.</p>',
          },
          {
            question: 'Can I send gifts for a team?',
            answerHtml:
              '<p>Yes. Corporate and bulk orders start from Corporate gifting.</p>',
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

  const giftChromeValue = {
    shopLabel: 'Shop',
    forWhomLabel: 'For Whom',
    journalLabel: 'Journal',
    journalHref: '/articles',
    shopLinks: [
      { href: '/gift/build-your-box', label: 'Build Your Box', group: 'Shop' },
      { href: '/gift/collections/ready-hampers', label: 'Ready-Made Hampers', group: 'Shop' },
      { href: '/gift/collections/welcome-baby', label: 'Welcome baby gifts', group: 'Occasion' },
      { href: '/gift/collections/baby-shower', label: 'Baby shower gifts', group: 'Occasion' },
      {
        href: '/gift/collections/naming-ceremony',
        label: 'Naming ceremony gifts',
        group: 'Occasion',
      },
      {
        href: '/gift/collections/first-birthday',
        label: 'First birthday gifts',
        group: 'Occasion',
      },
      { href: '/gift/collections/bestsellers', label: 'Best sellers', group: 'Curated' },
      { href: '/gift/collections/editors-picks', label: "Editor's picks", group: 'Curated' },
      { href: '/gift/collections/new-arrivals', label: 'New arrivals', group: 'Curated' },
      { href: '/gift/collections/on-sale', label: 'On sale', group: 'Curated' },
    ],
    forWhomLinks: [
      { href: '/gift/collections/for-baby-girl', label: 'Baby Girl', group: 'For baby' },
      { href: '/gift/collections/for-baby-boy', label: 'Baby Boy', group: 'For baby' },
      { href: '/gift/collections/for-expecting-mom', label: 'Expecting Mom', group: 'For baby' },
      { href: '/gift/collections/unisex-gifts', label: 'Unisex', group: 'For baby' },
      { href: '/gift/collections/newborn', label: 'Newborn', group: 'By age' },
      { href: '/gift/collections/infant', label: 'Infant', group: 'By age' },
      { href: '/gift/collections/toddler', label: 'Toddler', group: 'By age' },
    ],
    footer: {
      brandName: 'Inabiya',
      brandHref: '/gift',
      tagline:
        'Thoughtfully personalised baby essentials & gifting for the tiny humans (and their moms) you love.',
      showNewsletter: true,
      copyright: '© {year} {brand}. Soft gifts for tiny humans.',
      newsletterTitle: 'Stay in the loop',
      newsletterHint: 'New drops & gentle parenting notes — no spam.',
      reachTitle: 'Reach us',
      reachLinks: [
        { label: 'hello@inabiya.in', href: 'mailto:hello@inabiya.in', network: 'mail' },
        { label: 'WhatsApp', href: 'https://wa.me/919693940330', network: 'whatsapp' },
        { label: '@inabiya', href: 'https://instagram.com/inabiya', network: 'instagram' },
      ],
      legalLinks: [
        { label: 'Privacy', href: '/privacy-policy' },
        { label: 'Contact', href: '/contact' },
      ],
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
            { label: 'Ready-Made Hampers', href: '/gift/collections/ready-hampers' },
            { label: 'Shop by Age', href: '/gift/collections/newborn' },
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
  };

  await prisma.commerceSetting.upsert({
    where: { key: 'gift.chrome' },
    update: { value: giftChromeValue },
    create: { key: 'gift.chrome', value: giftChromeValue },
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

  const companyPages: Array<{
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
      seoDescription:
        'Thoughtfully personalised baby essentials and Soft Gift gifting across India.',
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
            ctaHref: '/gift',
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
            html: '<p><strong>Email</strong> — <a href="mailto:hello@inabiya.in">hello@inabiya.in</a></p><p><strong>WhatsApp</strong> — <a href="https://wa.me/919693940330">+91 96939 40330</a></p><p><strong>Corporate gifting</strong> — <a href="/gift/corporate">Request a quote</a></p>',
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

  for (const page of companyPages) {
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
    console.log(`Seeded MarketingPage slug=${page.slug}`);
  }

  // Drop known QA/test marketing pages (keep home + corporate + company pages).
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
  if (testDeleted.count) {
    console.log(`Removed ${testDeleted.count} test MarketingPage row(s)`);
  }

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

  // OPS-10 — Delhi-area suppliers + sample ORDERED PO
  const delhiSuppliers = [
    {
      code: 'OKHLA-PKG',
      name: 'Okhla Gift Packaging Co.',
      contactName: 'Ravi Mehra',
      phone: '9810001001',
      email: 'orders@okhlapack.example',
      city: 'New Delhi',
      state: 'DL',
      gstin: '07AABCU9603R1ZM',
      notes: 'Okhla Phase II — boxes & kraft wraps',
    },
    {
      code: 'CHANDNI-CRAFT',
      name: 'Chandni Chowk Crafts',
      contactName: 'Farida Khan',
      phone: '9810001002',
      email: 'wholesale@chandnicrafts.example',
      city: 'Old Delhi',
      state: 'DL',
      gstin: '07AABCU9603R1ZN',
      notes: 'Kinari Bazaar — soft toys & textiles',
    },
    {
      code: 'MAYAPURI-HAMP',
      name: 'Mayapuri Hamper Wholesale',
      contactName: 'Suresh Gupta',
      phone: '9810001003',
      email: 'sales@mayapurihamper.example',
      city: 'New Delhi',
      state: 'DL',
      gstin: '07AABCU9603R1ZO',
      notes: 'Mayapuri Industrial Area — ready hampers',
    },
  ] as const;

  for (const s of delhiSuppliers) {
    await prisma.supplier.upsert({
      where: { code: s.code },
      update: {
        name: s.name,
        contactName: s.contactName,
        phone: s.phone,
        email: s.email,
        city: s.city,
        state: s.state,
        gstin: s.gstin,
        notes: s.notes,
        isActive: true,
      },
      create: { ...s, isActive: true },
    });
  }

  const okhla = await prisma.supplier.findUniqueOrThrow({ where: { code: 'OKHLA-PKG' } });
  const bath = await prisma.productVariant.findUnique({ where: { sku: 'BATH-001' } });
  const blank = await prisma.productVariant.findUnique({ where: { sku: 'BLNK-001' } });
  if (bath && blank) {
    await prisma.productVariant.update({
      where: { id: bath.id },
      data: { preferredSupplierId: okhla.id },
    });
    const existingPo = await prisma.purchaseOrder.findFirst({
      where: { poNumber: 'PO-SEED-OKHLA-001' },
    });
    if (!existingPo) {
      await prisma.purchaseOrder.create({
        data: {
          poNumber: 'PO-SEED-OKHLA-001',
          supplierId: okhla.id,
          status: 'ORDERED',
          orderedAt: new Date(),
          notes: 'Seed PO — Okhla restock (demo)',
          lines: {
            create: [
              {
                variantId: bath.id,
                sku: bath.sku,
                title: 'Lavender Bath Essentials',
                quantityOrdered: 20,
                unitCostPaise: 27500,
              },
              {
                variantId: blank.id,
                sku: blank.sku,
                title: 'Personalised Name Blanket',
                quantityOrdered: 15,
                unitCostPaise: 18000,
              },
            ],
          },
        },
      });
    }
  }
  console.log('Seeded Delhi suppliers + sample ORDERED PO');

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
