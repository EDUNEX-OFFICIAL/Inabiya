import type { SeoSchemaEntry } from '@inabiya/validation';
import { sanitizeArticleHtml } from '@/lib/article-html';
import { attachStyle } from '../section-style';
import { defaultHeroTrustLine } from '@/components/cms/parse-trust-line';
import { HERO_LAYOUTS, HERO_LAYOUT_LABELS, parseHeroLayout, type HeroLayout } from '../hero-layout';
import {
  CUSTOM_SECTION_LAYOUTS,
  CUSTOM_SECTION_LAYOUT_LABELS,
  parseCustomSectionLayout,
  type CustomSectionLayout,
} from '../custom-section-layout';
import {
  parseRecipientAccent,
  parseRecipientGrid,
  RECIPIENT_GRID_MAX,
} from '@/lib/cms-section-layout';

export type { HeroLayout, CustomSectionLayout };
export { HERO_LAYOUTS, HERO_LAYOUT_LABELS, parseHeroLayout };
export { CUSTOM_SECTION_LAYOUTS, CUSTOM_SECTION_LAYOUT_LABELS, parseCustomSectionLayout };

export type BlockType =
  | 'hero'
  | 'richText'
  | 'image'
  | 'productGrid'
  | 'cta'
  | 'spacer'
  | 'brandStrip'
  | 'recipientSplit'
  | 'discoveryChips'
  | 'buildYourBoxTeaser'
  | 'articleTeasers'
  | 'footer'
  | 'saleStrip'
  | 'faq'
  | 'exclusiveOffers'
  | 'testimonials'
  | 'countdown'
  | 'featuredCarousel'
  | 'whatsappCta'
  | 'offerCarousel'
  | 'thinStrip'
  | 'customSection';

export type Block = {
  clientId: string;
  type: BlockType;
  props: Record<string, string>;
};

export type MarketingPage = {
  id: string;
  slug: string;
  title: string;
  status: string;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalPath: string | null;
  ogImageUrl: string | null;
  robotsIndex: boolean;
  seoSchemaExtras?: SeoSchemaEntry[] | null;
  isHomepage?: boolean;
  blocks: Array<{ id: string; type: string; props: Record<string, unknown> }>;
};

export const ALL_TYPES: BlockType[] = [
  'hero',
  'richText',
  'image',
  'productGrid',
  'cta',
  'spacer',
  'brandStrip',
  'recipientSplit',
  'discoveryChips',
  'buildYourBoxTeaser',
  'articleTeasers',
  'footer',
  'saleStrip',
  'faq',
  'exclusiveOffers',
  'testimonials',
  'countdown',
  'featuredCarousel',
  'whatsappCta',
  'offerCarousel',
  'thinStrip',
  'customSection',
];

const DEFAULT_FEATURED_CARDS_JSON = JSON.stringify(
  [
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
  ],
  null,
  0,
);

const DEFAULT_OFFER_CAROUSEL_JSON = JSON.stringify(
  [
    {
      tag: 'Welcome Baby',
      title: 'Save 10%',
      subtitle: 'Newborn hampers',
      body: 'Curated welcome boxes with wrap and a personalised note.',
      ctaLabel: 'Shop',
      ctaHref: '/collections/ready-hampers',
      tone: 'blush',
      icon: 'heart',
    },
    {
      tag: 'Flash sale',
      title: 'Free wrap',
      subtitle: 'This week only',
      body: 'Complimentary gift wrap on boxes over ₹1,999.',
      ctaLabel: 'Browse',
      ctaHref: '/collections/bestsellers',
      tone: 'sky',
      icon: 'box',
    },
    {
      tag: 'Corporate',
      title: 'Save 15%',
      subtitle: 'Team gifting',
      body: 'Bulk welcome-baby gifts with branded cards.',
      ctaLabel: 'Get a quote',
      ctaHref: '/corporate',
      tone: 'lavender',
      icon: 'briefcase',
    },
    {
      tag: 'Milestone',
      title: 'Toys 12% off',
      subtitle: 'Play & learn',
      body: 'Wooden toys that grow with baby.',
      ctaLabel: 'Shop toys',
      ctaHref: '/collections/bestsellers',
      tone: 'blush',
      icon: 'heart',
    },
  ],
  null,
  0,
);

export const EMPTY_PROPS: Record<BlockType, Record<string, string>> = {
  hero: {
    headline: '',
    subcopy: '',
    eyebrow: '',
    ctaLabel: '',
    ctaHref: '/',
    ctaLabel2: '',
    ctaHref2: '',
    trustLine: '',
    accentWord: '',
    imageUrl: '',
    imageUrl2: '',
    headline2: '',
    subcopy2: '',
    variant: 'storefront',
    layout: '',
  },
  richText: { html: '<p></p>' },
  image: { url: '', alt: '', caption: '' },
  productGrid: {
    source: 'auto',
    title: '',
    overline: '',
    subtitle: '',
    productSlugs: '',
    category: '',
    occasion: '',
    age: '',
    recipient: '',
    hamper: 'false',
    newWithinDays: '30',
    limit: '8',
    seeAllHref: '',
    seeAllLabel: 'See all',
  },
  cta: { label: 'Shop', href: '/', variant: 'primary', title: '', body: '' },
  spacer: { size: 'md' },
  brandStrip: {
    title: 'Trusted brands we stock',
    subtitle: '',
    overline: '',
    brands: '',
    usps: '',
    showUsps: 'false',
    uspColumns: '4',
  },
  recipientSplit: {
    title: 'Shop by baby',
    subtitle: 'Curated palettes, unisex-safe products.',
    overline: 'For every little one',
    grid: '2x1',
    itemsJson: JSON.stringify(
      [
        {
          label: 'girl',
          href: '/collections/for-baby-girl',
          eyebrow: 'For the little',
          blurb: 'Blush ribbons, gentle pastels, gender-neutral picks.',
          cta: 'Shop girl gifts →',
          accent: 'pink',
          imageUrl: '/gift/media/baby-girl-soft.jpg',
          imageAlt: 'Baby girl with soft toys',
        },
        {
          label: 'boy',
          href: '/collections/for-baby-boy',
          eyebrow: 'For the little',
          blurb: 'Sky ribbons, soft brights, gender-neutral picks.',
          cta: 'Shop boy gifts →',
          accent: 'sky',
          imageUrl: '/gift/media/train-toy.jpg',
          imageAlt: 'Wooden train set for little boys',
        },
      ],
      null,
      0,
    ),
  },
  discoveryChips: {
    overline: '',
    title: 'Shop by collection',
    subtitle: '',
    seeAllHref: '/products',
    seeAllLabel: 'See all',
    limit: '4',
    itemsSource: 'catalogCollections',
    items:
      'Baby girl | /collections/for-baby-girl | /gift/media/baby-clothes.jpg | Baby girl\nReady hampers | /collections/ready-hampers | /gift/media/baby-cues.jpg | Hampers\nBirthday | /collections/first-birthday | /gift/media/train-toy.jpg | Birthday\nMom | /collections/for-expecting-mom | /gift/media/baby-mom.jpg | Mom',
  },
  buildYourBoxTeaser: {
    overline: '6-step gift builder',
    title: 'Customise a box just for them.',
    body: 'Choose recipient, age, occasion, budget and collections — we curate a perfect box that never goes over budget.',
    ctaLabel: 'Build Your Box',
    ctaHref: '/build-your-box',
    imageUrl: '',
    imageAlt: '',
    imageFit: 'contain',
    steps:
      'Who is it for? | Girl, boy, mom, or unisex\nBaby age | Newborn to toddler\nOccasion | Shower, naming, birthday\nBudget | Stay on budget\nCollections | Soft Gift themes\nYour box | Review and checkout',
  },
  articleTeasers: {
    overline: 'Blogs',
    title: 'From the parenting blogs',
    subtitle: '',
    limit: '3',
    seeAllHref: '/blog',
    seeAllLabel: 'All articles →',
  },
  footer: {
    brandName: 'Inabiya',
    tagline: 'Thoughtfully personalised baby essentials & gifting.',
    shopLinks: '',
    companyLinks: '',
  },
  saleStrip: {
    text: 'Free personalisation on gift boxes this week',
    ctaLabel: 'Shop →',
    ctaHref: '/',
    tone: 'blush',
  },
  faq: {
    overline: 'Help',
    title: 'Frequently asked questions',
    itemsJson: JSON.stringify(
      [
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
          answerHtml: '<p>Yes. Corporate and bulk orders start from Corporate gifting.</p>',
        },
      ],
      null,
      0,
    ),
  },
  exclusiveOffers: {
    overline: 'Limited-time benefits',
    title: 'Exclusive Offers for Every Occasion',
    subtitle: 'Curated for every occasion',
    columns: '3',
    cardsJson: JSON.stringify(
      [
        {
          tag: 'Welcome Baby',
          title: 'Save 10%',
          subtitle: 'Welcome Baby',
          body: 'Celebrate every newborn with curated hampers, gift wrapping and a personalised message.',
          ctaLabel: 'Order Now',
          ctaHref: '/collections/ready-hampers',
          tone: 'blush',
          icon: 'heart',
        },
        {
          tag: 'Corporate Gifting',
          title: 'Save up to 15%',
          subtitle: 'Corporate Gifting',
          body: 'Thoughtful welcome-baby gifts for your team with branded cards and PAN-India delivery.',
          ctaLabel: 'Get a Quote',
          ctaHref: '/corporate',
          tone: 'sky',
          icon: 'briefcase',
        },
        {
          tag: 'Bulk & Event Gifting',
          title: 'Save up to 20%',
          subtitle: 'Bulk & Event Gifting',
          body: 'Perfect for baby showers, naming ceremonies and celebrations with 20+ hampers.',
          ctaLabel: 'Enquire',
          ctaHref: '/corporate',
          tone: 'lavender',
          icon: 'box',
        },
      ],
      null,
      0,
    ),
  },
  testimonials: {
    overline: 'Parent love',
    title: 'Loved by new parents across India',
    subtitle: '',
    ctaLabel: '',
    ctaHref: '',
    display: 'auto',
    quoteColumns: '2',
    itemsJson: JSON.stringify(
      [
        {
          quote: 'The box felt personal in a way Amazon never could. My sister cried happy tears.',
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
        },
        {
          quote: 'Loved that the builder respected my ₹1,499 budget. No upsell tricks.',
          author: 'Kavya',
          role: 'Mumbai',
          rating: 5,
        },
      ],
      null,
      0,
    ),
  },
  countdown: {
    endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    title: 'Sale ends soon',
    expiredLabel: 'This offer has ended',
    ctaLabel: 'Shop now',
    ctaHref: '/',
  },
  featuredCarousel: {
    eyebrow: 'Explore Inabiya',
    headline: 'A different way to gift',
    accentWord: 'gift',
    subcopy:
      'Swipe through the ways to gift with Inabiya — create, develop and explore, all in one place.',
    cardsJson: DEFAULT_FEATURED_CARDS_JSON,
  },
  whatsappCta: {
    eyebrow: 'Early access',
    title: "Be First to See What's New",
    body: 'Fresh styles arrive every week. Join Inabiya on WhatsApp for new-arrival alerts and early access to fresh drops.',
    countryCode: '+91',
    placeholder: 'Enter WhatsApp number',
    ctaLabel: 'Get early access',
    disclaimer: 'By joining, you agree to receive Inabiya updates on WhatsApp. Opt out anytime.',
  },
  offerCarousel: {
    overline: 'This week',
    title: 'Offers in motion',
    subtitle: 'Swipe through limited-time savings.',
    cardsJson: DEFAULT_OFFER_CAROUSEL_JSON,
  },
  thinStrip: {
    text: 'Free personalisation on gift boxes this week',
    items: 'Free wrap over ₹1,999\nName notes on every hamper\nPAN-India delivery',
    ctaLabel: 'Shop',
    ctaHref: '/collections/bestsellers',
    tone: 'gold',
    marquee: 'true',
  },
  customSection: {
    layout: 'stack',
    overline: '',
    title: '',
    body: '',
    title2: '',
    body2: '',
    title3: '',
    body3: '',
    imageUrl: '',
    imageUrl2: '',
    imageUrl3: '',
    ctaLabel: '',
    ctaHref: '',
    ctaLabel2: '',
    ctaHref2: '',
    bg: 'default',
    bgImageUrl: '',
    width: 'page',
    minHeight: 'md',
    radius: 'none',
  },
};

let clientSeq = 0;
export function newClientId() {
  clientSeq += 1;
  return `b-${clientSeq}-${Date.now()}`;
}

function nestCard(
  prefix: 'left' | 'right',
  props: Record<string, string>,
): {
  label: string;
  href: string;
  eyebrow?: string;
  cta?: string;
  accent?: 'pink' | 'sky' | 'mint' | 'lavender';
  imageUrl?: string;
  imageAlt?: string;
  blurb?: string;
} {
  const label = props[`${prefix}Label`] || (prefix === 'left' ? 'girl' : 'boy');
  const href =
    props[`${prefix}Href`] ||
    (prefix === 'left' ? '/collections/for-baby-girl' : '/collections/for-baby-boy');
  const accent = parseRecipientAccent(props[`${prefix}Accent`], prefix === 'left' ? 0 : 1);
  return {
    label,
    href,
    ...(props[`${prefix}Eyebrow`] ? { eyebrow: props[`${prefix}Eyebrow`] } : {}),
    ...(props[`${prefix}Blurb`] ? { blurb: props[`${prefix}Blurb`] } : {}),
    ...(props[`${prefix}Cta`] ? { cta: props[`${prefix}Cta`] } : {}),
    accent,
    ...(props[`${prefix}ImageUrl`] ? { imageUrl: props[`${prefix}ImageUrl`] } : {}),
    ...(props[`${prefix}ImageAlt`] ? { imageAlt: props[`${prefix}ImageAlt`] } : {}),
  };
}

function cardFromUnknown(row: unknown, index: number) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return null;
  const card = row as Record<string, unknown>;
  const label = String(card.label ?? '').trim();
  const href = String(card.href ?? '').trim();
  if (!label || !href) return null;
  const accent = parseRecipientAccent(card.accent, index);
  return {
    label,
    href,
    ...(card.eyebrow ? { eyebrow: String(card.eyebrow) } : {}),
    ...(card.blurb ? { blurb: String(card.blurb) } : {}),
    ...(card.cta ? { cta: String(card.cta) } : {}),
    accent,
    ...(card.imageUrl ? { imageUrl: String(card.imageUrl).trim() } : {}),
    ...(card.imageAlt ? { imageAlt: String(card.imageAlt).trim() } : {}),
  };
}

export function toEditable(blocks: MarketingPage['blocks']): Block[] {
  return blocks
    .filter((b) => ALL_TYPES.includes(b.type as BlockType))
    .map((b) => {
      const props: Record<string, string> = { ...EMPTY_PROPS[b.type as BlockType] };
      const raw = b.props ?? {};

      if (b.type === 'recipientSplit') {
        for (const [k, v] of Object.entries(raw)) {
          if (k === 'left' || k === 'right' || k === 'items') continue;
          if (v != null && typeof v !== 'object') props[k] = String(v);
        }
        const fromItems = Array.isArray(raw.items)
          ? raw.items
              .map((row, i) => cardFromUnknown(row, i))
              .filter((row): row is NonNullable<ReturnType<typeof cardFromUnknown>> => row != null)
          : [];
        const items =
          fromItems.length >= 2
            ? fromItems
            : [cardFromUnknown(raw.left, 0), cardFromUnknown(raw.right, 1)].filter(
                (row): row is NonNullable<ReturnType<typeof cardFromUnknown>> => row != null,
              );
        if (items.length >= 2) {
          props.itemsJson = JSON.stringify(items);
        }
        if (!props.grid) props.grid = '2x1';
      } else {
        for (const [k, v] of Object.entries(raw)) {
          if (k === 'products' || k === 'articles') {
            // Resolved catalog/journal payload — editor keeps source fields only
            continue;
          }
          if (k === 'productSlugs' && Array.isArray(v)) {
            props.productSlugs = v.map(String).join(', ');
          } else if (k === 'brands' && Array.isArray(v)) {
            props.brands = v
              .map((item) => {
                if (typeof item === 'string') return item;
                if (item && typeof item === 'object' && 'name' in item) {
                  const name = String((item as { name: unknown }).name);
                  const logo =
                    typeof (item as { logoUrl?: unknown }).logoUrl === 'string'
                      ? String((item as { logoUrl: string }).logoUrl)
                      : '';
                  return logo ? `${name} | ${logo}` : name;
                }
                return '';
              })
              .filter(Boolean)
              .join(', ');
          } else if (k === 'usps' && Array.isArray(v)) {
            props.usps = v
              .map((item) => {
                if (!item || typeof item !== 'object') return '';
                const label = String((item as { label?: unknown }).label ?? '').trim();
                const icon = String((item as { icon?: unknown }).icon ?? '').trim();
                const body = String((item as { body?: unknown }).body ?? '').trim();
                if (!label) return '';
                const head = icon ? `${icon}:${label}` : label;
                return body ? `${head}|${body}` : head;
              })
              .filter(Boolean)
              .join(', ');
          } else if (k === 'columns' && Array.isArray(v) && b.type === 'footer') {
            const cols = v as Array<{
              title?: string;
              links?: Array<{ label: string; href: string }>;
            }>;
            const shop = cols.find((c) => /shop/i.test(String(c.title ?? ''))) ?? cols[0];
            const company = cols.find((c) => /company/i.test(String(c.title ?? ''))) ?? cols[1];
            props.shopLinks = (shop?.links ?? []).map((l) => `${l.label} | ${l.href}`).join('\n');
            props.companyLinks = (company?.links ?? [])
              .map((l) => `${l.label} | ${l.href}`)
              .join('\n');
          } else if (k === 'showUsps') {
            props.showUsps = v === false || v === 'false' ? 'false' : 'true';
          } else if (k === 'hamper') {
            props.hamper = v === true || v === 'true' ? 'true' : 'false';
          } else if (k === 'limit' && v != null) {
            props.limit = String(v);
          } else if (k === 'items' && Array.isArray(v) && b.type === 'faq') {
            props.itemsJson = JSON.stringify(
              v
                .filter((row): row is Record<string, unknown> => !!row && typeof row === 'object')
                .map((row) => ({
                  question: String(row.question ?? ''),
                  answerHtml: String(row.answerHtml ?? ''),
                })),
            );
          } else if (k === 'items' && Array.isArray(v) && b.type === 'discoveryChips') {
            props.items = v
              .filter((row): row is Record<string, unknown> => !!row && typeof row === 'object')
              .map((row) => {
                const label = String(row.label ?? '').trim();
                const href = String(row.href ?? '').trim();
                const imageUrl = String(row.imageUrl ?? '').trim();
                const imageAlt = String(row.imageAlt ?? '').trim();
                if (!label || !href) return '';
                if (imageUrl) {
                  return imageAlt
                    ? `${label} | ${href} | ${imageUrl} | ${imageAlt}`
                    : `${label} | ${href} | ${imageUrl}`;
                }
                return `${label} | ${href}`;
              })
              .filter(Boolean)
              .join('\n');
          } else if (
            k === 'cards' &&
            Array.isArray(v) &&
            (b.type === 'exclusiveOffers' ||
              b.type === 'offerCarousel' ||
              b.type === 'featuredCarousel')
          ) {
            props.cardsJson = JSON.stringify(v);
          } else if (k === 'items' && Array.isArray(v) && b.type === 'thinStrip') {
            props.items = v
              .map((row) => String(row ?? '').trim())
              .filter(Boolean)
              .join('\n');
          } else if (k === 'marquee') {
            props.marquee = v === true || v === 'true' ? 'true' : 'false';
          } else if (k === 'items' && Array.isArray(v) && b.type === 'testimonials') {
            props.itemsJson = JSON.stringify(v);
          } else if (k === 'steps' && Array.isArray(v) && b.type === 'buildYourBoxTeaser') {
            props.steps = v
              .filter((row): row is Record<string, unknown> => !!row && typeof row === 'object')
              .map((row) => {
                const title = String(row.title ?? '').trim();
                const body = String(row.body ?? '').trim();
                return body ? `${title} | ${body}` : title;
              })
              .filter(Boolean)
              .join('\n');
          } else if (v != null && typeof v !== 'object') {
            props[k] = String(v);
          }
        }
      }

      return { clientId: b.id || newClientId(), type: b.type as BlockType, props };
    });
}

function payloadWithoutStyle(b: Block) {
  if (b.type === 'hero') {
    const variant =
      b.props.variant === 'storefront' || b.props.variant === 'panel' ? b.props.variant : undefined;
    const layout = parseHeroLayout(b.props.layout);
    return {
      type: 'hero' as const,
      props: {
        headline: b.props.headline || 'Headline',
        ...(b.props.subcopy ? { subcopy: b.props.subcopy } : {}),
        ...(b.props.ctaLabel ? { ctaLabel: b.props.ctaLabel } : {}),
        ...(b.props.ctaHref ? { ctaHref: b.props.ctaHref } : {}),
        ...(b.props.ctaLabel2 ? { ctaLabel2: b.props.ctaLabel2 } : {}),
        ...(b.props.ctaHref2 ? { ctaHref2: b.props.ctaHref2 } : {}),
        ...(b.props.trustLine ? { trustLine: b.props.trustLine } : {}),
        ...(b.props.eyebrow ? { eyebrow: b.props.eyebrow } : {}),
        ...(b.props.accentWord ? { accentWord: b.props.accentWord } : {}),
        ...(b.props.imageUrl ? { imageUrl: b.props.imageUrl } : {}),
        ...(b.props.imageUrl2 ? { imageUrl2: b.props.imageUrl2 } : {}),
        ...(b.props.headline2 ? { headline2: b.props.headline2 } : {}),
        ...(b.props.subcopy2 ? { subcopy2: b.props.subcopy2 } : {}),
        ...(variant ? { variant } : {}),
        ...(layout ? { layout } : {}),
      },
    };
  }
  if (b.type === 'richText') {
    return {
      type: 'richText' as const,
      props: { html: sanitizeArticleHtml(b.props.html || '<p></p>') || '<p></p>' },
    };
  }
  if (b.type === 'image') {
    return {
      type: 'image' as const,
      props: {
        url: b.props.url || 'https://placehold.co/800x400',
        alt: b.props.alt || 'Image',
        ...(b.props.caption ? { caption: b.props.caption } : {}),
      },
    };
  }
  if (b.type === 'productGrid') {
    const slugs = (b.props.productSlugs || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const limitNum = Number.parseInt(b.props.limit || '', 10);
    const newDays = Number.parseInt(b.props.newWithinDays || '', 10);
    const sourceRaw = b.props.source || 'auto';
    const source = (
      ['auto', 'manual', 'bestsellers', 'editors', 'new', 'on_sale'] as const
    ).includes(sourceRaw as 'auto')
      ? (sourceRaw as 'auto' | 'manual' | 'bestsellers' | 'editors' | 'new' | 'on_sale')
      : 'auto';
    const occasion = (['welcome-baby', 'baby-shower', 'naming', 'birthday'] as const).includes(
      b.props.occasion as 'naming',
    )
      ? (b.props.occasion as 'welcome-baby' | 'baby-shower' | 'naming' | 'birthday')
      : undefined;
    const age = (['newborn', 'infant', 'toddler', 'any'] as const).includes(
      b.props.age as 'newborn',
    )
      ? (b.props.age as 'newborn' | 'infant' | 'toddler' | 'any')
      : undefined;
    const recipient = (['girl', 'boy', 'mom', 'unisex'] as const).includes(
      b.props.recipient as 'girl',
    )
      ? (b.props.recipient as 'girl' | 'boy' | 'mom' | 'unisex')
      : undefined;
    return {
      type: 'productGrid' as const,
      props: {
        source,
        ...(b.props.title ? { title: b.props.title } : {}),
        ...(b.props.overline ? { overline: b.props.overline } : {}),
        ...(b.props.subtitle ? { subtitle: b.props.subtitle } : {}),
        ...(slugs.length ? { productSlugs: slugs } : {}),
        ...(b.props.category ? { category: b.props.category } : {}),
        ...(occasion ? { occasion } : {}),
        ...(age ? { age } : {}),
        ...(recipient ? { recipient } : {}),
        ...(b.props.hamper === 'true' ? { hamper: true } : {}),
        ...(Number.isFinite(newDays) && newDays >= 1 && newDays <= 90
          ? { newWithinDays: newDays }
          : {}),
        ...(Number.isFinite(limitNum) && limitNum > 0 ? { limit: limitNum } : {}),
        ...(b.props.seeAllHref ? { seeAllHref: b.props.seeAllHref } : {}),
        ...(b.props.seeAllLabel ? { seeAllLabel: b.props.seeAllLabel } : {}),
      },
    };
  }
  if (b.type === 'spacer') {
    const size = (['sm', 'md', 'lg'] as const).includes(b.props.size as 'sm' | 'md' | 'lg')
      ? (b.props.size as 'sm' | 'md' | 'lg')
      : 'md';
    return { type: 'spacer' as const, props: { size } };
  }
  if (b.type === 'brandStrip') {
    const brands = (b.props.brands || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((entry) => {
        const [namePart, logoPart] = entry.split('|').map((x) => x.trim());
        if (logoPart) return { name: namePart, logoUrl: logoPart };
        return namePart;
      });
    const usps = (b.props.usps || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((entry) => {
        const m = entry.match(
          /^(heart|package|gift|truck|shield|sparkles)\s*:\s*([^|]+)(?:\|(.+))?$/i,
        );
        if (m?.[1] && m[2]) {
          return {
            icon: m[1].toLowerCase() as
              'heart' | 'package' | 'gift' | 'truck' | 'shield' | 'sparkles',
            label: m[2].trim(),
            ...(m[3]?.trim() ? { body: m[3].trim() } : {}),
          };
        }
        const [labelPart, bodyPart] = entry.split('|').map((x) => x.trim());
        return {
          label: labelPart,
          ...(bodyPart ? { body: bodyPart } : {}),
        };
      });
    return {
      type: 'brandStrip' as const,
      props: {
        ...(b.props.title ? { title: b.props.title } : {}),
        ...(b.props.subtitle ? { subtitle: b.props.subtitle } : {}),
        ...(b.props.overline !== undefined ? { overline: b.props.overline } : {}),
        ...(brands.length ? { brands } : {}),
        ...(usps.length ? { usps } : {}),
        ...(b.props.showUsps === 'true'
          ? { showUsps: true }
          : b.props.showUsps === 'false'
            ? { showUsps: false }
            : {}),
        ...(b.props.uspColumns === '2' || b.props.uspColumns === '3' || b.props.uspColumns === '4'
          ? { uspColumns: Number(b.props.uspColumns) as 2 | 3 | 4 }
          : {}),
      },
    };
  }
  if (b.type === 'recipientSplit') {
    let parsedItems: unknown[] = [];
    if (b.props.itemsJson?.trim()) {
      try {
        const parsed = JSON.parse(b.props.itemsJson) as unknown;
        parsedItems = Array.isArray(parsed) ? parsed : [];
      } catch {
        throw new Error('Shop by baby cards JSON is invalid.');
      }
    }
    const fromJson = parsedItems
      .map((row, i) => cardFromUnknown(row, i))
      .filter((row): row is NonNullable<ReturnType<typeof cardFromUnknown>> => row != null);
    const items =
      fromJson.length >= 2 ? fromJson : [nestCard('left', b.props), nestCard('right', b.props)];
    if (items.length < 2) {
      throw new Error('Shop by baby needs at least two cards.');
    }
    const grid = parseRecipientGrid(b.props.grid);
    const stored = items.slice(0, 6);
    const visible = stored.slice(0, RECIPIENT_GRID_MAX[grid]);
    const left = visible[0]!;
    const right = visible[1] ?? visible[0]!;
    return {
      type: 'recipientSplit' as const,
      props: {
        ...(b.props.title ? { title: b.props.title } : {}),
        ...(b.props.subtitle ? { subtitle: b.props.subtitle } : {}),
        ...(b.props.overline ? { overline: b.props.overline } : {}),
        grid,
        items: stored,
        left,
        right,
      },
    };
  }
  if (b.type === 'discoveryChips') {
    const rawItems = b.props.items || '';
    const itemLines = rawItems.includes('\n') ? rawItems.split('\n') : rawItems.split(',');
    const items = itemLines
      .map((s) => s.trim())
      .filter(Boolean)
      .map((entry) => {
        const parts = entry.split('|').map((x) => x.trim());
        const label = parts[0] || parts[1];
        const href = parts[1] || parts[0];
        const imageUrl = parts[2] || '';
        const imageAlt = parts[3] || '';
        return {
          label,
          href,
          ...(imageUrl ? { imageUrl } : {}),
          ...(imageAlt ? { imageAlt } : {}),
        };
      })
      .filter((i) => i.href);
    const limitNum = Number.parseInt(b.props.limit || '', 10);
    return {
      type: 'discoveryChips' as const,
      props: {
        ...(b.props.overline ? { overline: b.props.overline } : {}),
        ...(b.props.title ? { title: b.props.title } : {}),
        ...(b.props.subtitle ? { subtitle: b.props.subtitle } : {}),
        ...(b.props.seeAllHref ? { seeAllHref: b.props.seeAllHref } : {}),
        ...(b.props.seeAllLabel ? { seeAllLabel: b.props.seeAllLabel } : {}),
        ...(b.props.itemsSource === 'catalogCollections' ||
        b.props.itemsSource === 'catalogCategories'
          ? { itemsSource: 'catalogCollections' }
          : {}),
        ...(Number.isFinite(limitNum) && limitNum > 0 ? { limit: limitNum } : { limit: 4 }),
        items,
      },
    };
  }
  if (b.type === 'buildYourBoxTeaser') {
    const steps = (b.props.steps || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [title, body] = line.split('|').map((s) => s.trim());
        return { title: title || body, ...(body ? { body } : {}) };
      })
      .filter((s) => s.title);
    return {
      type: 'buildYourBoxTeaser' as const,
      props: {
        title: b.props.title || 'Build Your Box',
        ...(b.props.overline ? { overline: b.props.overline } : {}),
        ...(b.props.body ? { body: b.props.body } : {}),
        ...(b.props.ctaLabel ? { ctaLabel: b.props.ctaLabel } : {}),
        ...(b.props.ctaHref ? { ctaHref: b.props.ctaHref } : {}),
        ...(b.props.imageUrl ? { imageUrl: b.props.imageUrl } : {}),
        ...(b.props.imageAlt ? { imageAlt: b.props.imageAlt } : {}),
        ...(b.props.imageFit === 'contain' || b.props.imageFit === 'cover'
          ? { imageFit: b.props.imageFit }
          : {}),
        ...(steps.length ? { steps } : {}),
      },
    };
  }
  if (b.type === 'articleTeasers') {
    const limitNum = Number.parseInt(b.props.limit || '', 10);
    return {
      type: 'articleTeasers' as const,
      props: {
        ...(b.props.overline ? { overline: b.props.overline } : {}),
        ...(b.props.title ? { title: b.props.title } : {}),
        ...(b.props.subtitle ? { subtitle: b.props.subtitle } : {}),
        ...(Number.isFinite(limitNum) && limitNum > 0 ? { limit: limitNum } : {}),
        ...(b.props.seeAllHref ? { seeAllHref: b.props.seeAllHref } : {}),
        ...(b.props.seeAllLabel ? { seeAllLabel: b.props.seeAllLabel } : {}),
      },
    };
  }
  if (b.type === 'footer') {
    const parseLinks = (text: string) =>
      text
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [label, href] = line.split('|').map((s) => s.trim());
          return { label: label || href, href: href || label };
        })
        .filter((l) => l.href);
    return {
      type: 'footer' as const,
      props: {
        ...(b.props.brandName ? { brandName: b.props.brandName } : {}),
        ...(b.props.tagline ? { tagline: b.props.tagline } : {}),
        columns: [
          { title: 'Shop', links: parseLinks(b.props.shopLinks || '') },
          { title: 'Company', links: parseLinks(b.props.companyLinks || '') },
        ].filter((c) => c.links.length > 0),
      },
    };
  }
  if (b.type === 'saleStrip') {
    const tone = (['blush', 'mint', 'sky', 'soft'] as const).includes(
      b.props.tone as 'blush' | 'mint' | 'sky' | 'soft',
    )
      ? (b.props.tone as 'blush' | 'mint' | 'sky' | 'soft')
      : 'blush';
    return {
      type: 'saleStrip' as const,
      props: {
        text: b.props.text || 'Limited-time offer',
        ...(b.props.ctaLabel ? { ctaLabel: b.props.ctaLabel } : {}),
        ...(b.props.ctaHref ? { ctaHref: b.props.ctaHref } : {}),
        tone,
      },
    };
  }
  if (b.type === 'faq') {
    let parsed: unknown;
    try {
      parsed = JSON.parse(b.props.itemsJson || '[]') as unknown;
    } catch {
      throw new Error('FAQ items JSON is invalid — fix the FAQ block before saving.');
    }
    if (!Array.isArray(parsed)) {
      throw new Error('FAQ items must be a JSON array of { question, answerHtml }.');
    }
    const items = parsed
      .filter((row): row is Record<string, unknown> => !!row && typeof row === 'object')
      .map((row) => ({
        question: String(row.question ?? '').trim(),
        answerHtml: String(row.answerHtml ?? '').trim(),
      }))
      .filter((row) => row.question && row.answerHtml)
      .slice(0, 20);
    if (items.length === 0) {
      throw new Error('FAQ block needs at least one question and answerHtml.');
    }
    return {
      type: 'faq' as const,
      props: {
        ...(b.props.overline ? { overline: b.props.overline } : {}),
        ...(b.props.title ? { title: b.props.title } : {}),
        items,
      },
    };
  }
  if (b.type === 'exclusiveOffers') {
    let parsed: unknown;
    try {
      parsed = JSON.parse(b.props.cardsJson || '[]') as unknown;
    } catch {
      throw new Error('Exclusive offers cards JSON is invalid.');
    }
    if (!Array.isArray(parsed)) {
      throw new Error('Exclusive offers cards must be a JSON array.');
    }
    const cards = parsed
      .filter((row): row is Record<string, unknown> => !!row && typeof row === 'object')
      .map((row) => ({
        tag: String(row.tag ?? '').trim(),
        title: String(row.title ?? '').trim(),
        ...(row.subtitle ? { subtitle: String(row.subtitle) } : {}),
        ...(row.body ? { body: String(row.body) } : {}),
        ctaLabel: String(row.ctaLabel ?? '').trim(),
        ctaHref: String(row.ctaHref ?? '').trim(),
        ...(row.tone === 'blush' || row.tone === 'sky' || row.tone === 'lavender'
          ? { tone: row.tone }
          : {}),
        ...(row.icon === 'heart' || row.icon === 'briefcase' || row.icon === 'box'
          ? { icon: row.icon }
          : {}),
      }))
      .filter((row) => row.tag && row.title && row.ctaLabel && row.ctaHref)
      .slice(0, 6);
    if (cards.length === 0) {
      throw new Error('Exclusive offers needs at least one card.');
    }
    return {
      type: 'exclusiveOffers' as const,
      props: {
        ...(b.props.overline ? { overline: b.props.overline } : {}),
        ...(b.props.title ? { title: b.props.title } : {}),
        ...(b.props.subtitle ? { subtitle: b.props.subtitle } : {}),
        ...(b.props.columns === '2' ? { columns: 2 as const } : { columns: 3 as const }),
        cards,
      },
    };
  }
  if (b.type === 'testimonials') {
    let parsed: unknown;
    try {
      parsed = JSON.parse(b.props.itemsJson || '[]') as unknown;
    } catch {
      throw new Error('Testimonials items JSON is invalid.');
    }
    if (!Array.isArray(parsed)) {
      throw new Error('Testimonials must be a JSON array.');
    }
    const items = parsed
      .filter((row): row is Record<string, unknown> => !!row && typeof row === 'object')
      .map((row) => {
        const ratingNum = Number(row.rating);
        const dated = String(row.dated ?? row.date ?? '').trim();
        return {
          quote: String(row.quote ?? '').trim(),
          author: String(row.author ?? '').trim(),
          ...(row.role ? { role: String(row.role) } : {}),
          ...(Number.isFinite(ratingNum) && ratingNum >= 1 && ratingNum <= 5
            ? { rating: Math.round(ratingNum) }
            : {}),
          ...(dated ? { dated } : {}),
        };
      })
      .filter((row) => row.quote && row.author)
      .slice(0, 12);
    if (items.length === 0) {
      throw new Error('Testimonials needs at least one quote.');
    }
    return {
      type: 'testimonials' as const,
      props: {
        ...(b.props.overline ? { overline: b.props.overline } : {}),
        ...(b.props.title ? { title: b.props.title } : {}),
        ...(b.props.subtitle ? { subtitle: b.props.subtitle } : {}),
        ...(b.props.ctaLabel ? { ctaLabel: b.props.ctaLabel } : {}),
        ...(b.props.ctaHref ? { ctaHref: b.props.ctaHref } : {}),
        ...(b.props.display === 'marquee' ||
        b.props.display === 'grid' ||
        b.props.display === 'auto'
          ? { display: b.props.display }
          : {}),
        ...(b.props.quoteColumns === '3'
          ? { quoteColumns: 3 as const }
          : { quoteColumns: 2 as const }),
        items,
      },
    };
  }
  if (b.type === 'countdown') {
    const endsAt = (b.props.endsAt || '').trim();
    if (!endsAt) {
      throw new Error('Countdown needs an endsAt ISO datetime.');
    }
    return {
      type: 'countdown' as const,
      props: {
        endsAt,
        ...(b.props.title ? { title: b.props.title } : {}),
        ...(b.props.expiredLabel ? { expiredLabel: b.props.expiredLabel } : {}),
        ...(b.props.ctaLabel ? { ctaLabel: b.props.ctaLabel } : {}),
        ...(b.props.ctaHref ? { ctaHref: b.props.ctaHref } : {}),
      },
    };
  }
  if (b.type === 'featuredCarousel') {
    let parsed: unknown;
    try {
      parsed = JSON.parse(b.props.cardsJson || '[]') as unknown;
    } catch {
      throw new Error('Featured carousel cards JSON is invalid.');
    }
    if (!Array.isArray(parsed)) {
      throw new Error('Featured carousel cards must be a JSON array.');
    }
    const cards = parsed
      .filter((row): row is Record<string, unknown> => !!row && typeof row === 'object')
      .map((row, i) => {
        const id = String(row.id ?? '').trim() || `card-${i + 1}`;
        const hoverImageUrl = String(row.hoverImageUrl ?? '').trim();
        const hoverVideoUrl = String(row.hoverVideoUrl ?? '').trim();
        const gradient = String(row.gradient ?? '').trim();
        const accent = String(row.accent ?? '').trim();
        return {
          id,
          category: String(row.category ?? '').trim(),
          kicker: String(row.kicker ?? '').trim(),
          title: String(row.title ?? '').trim(),
          ...(row.description ? { description: String(row.description) } : {}),
          ...(row.imageUrl ? { imageUrl: String(row.imageUrl).trim() } : {}),
          ...(hoverImageUrl ? { hoverImageUrl } : {}),
          ...(hoverVideoUrl ? { hoverVideoUrl } : {}),
          ...(gradient ? { gradient } : {}),
          ...(accent ? { accent } : {}),
          href: String(row.href ?? '').trim(),
        };
      })
      .filter((row) => row.category && row.kicker && row.title && row.href)
      .slice(0, 8);
    if (cards.length === 0) {
      throw new Error('Featured carousel needs at least one card.');
    }
    return {
      type: 'featuredCarousel' as const,
      props: {
        ...(b.props.eyebrow ? { eyebrow: b.props.eyebrow } : {}),
        ...(b.props.headline ? { headline: b.props.headline } : {}),
        ...(b.props.accentWord ? { accentWord: b.props.accentWord } : {}),
        ...(b.props.subcopy ? { subcopy: b.props.subcopy } : {}),
        cards,
      },
    };
  }
  if (b.type === 'whatsappCta') {
    const countryRaw = (b.props.countryCode || '+91').trim();
    const countryCode = /^\+\d{1,4}$/.test(countryRaw) ? countryRaw : '+91';
    return {
      type: 'whatsappCta' as const,
      props: {
        title: b.props.title || "Be First to See What's New",
        ...(b.props.eyebrow ? { eyebrow: b.props.eyebrow } : {}),
        ...(b.props.body ? { body: b.props.body } : {}),
        countryCode,
        ...(b.props.placeholder ? { placeholder: b.props.placeholder } : {}),
        ...(b.props.ctaLabel ? { ctaLabel: b.props.ctaLabel } : {}),
        ...(b.props.disclaimer ? { disclaimer: b.props.disclaimer } : {}),
      },
    };
  }
  if (b.type === 'offerCarousel') {
    let parsed: unknown;
    try {
      parsed = JSON.parse(b.props.cardsJson || '[]') as unknown;
    } catch {
      throw new Error('Offer carousel cards JSON is invalid.');
    }
    if (!Array.isArray(parsed)) {
      throw new Error('Offer carousel cards must be a JSON array.');
    }
    const cards = parsed
      .filter((row): row is Record<string, unknown> => !!row && typeof row === 'object')
      .map((row) => ({
        tag: String(row.tag ?? '').trim(),
        title: String(row.title ?? '').trim(),
        ...(row.subtitle ? { subtitle: String(row.subtitle) } : {}),
        ...(row.body ? { body: String(row.body) } : {}),
        ctaLabel: String(row.ctaLabel ?? '').trim(),
        ctaHref: String(row.ctaHref ?? '').trim(),
        ...(row.tone === 'blush' || row.tone === 'sky' || row.tone === 'lavender'
          ? { tone: row.tone }
          : {}),
        ...(row.icon === 'heart' || row.icon === 'briefcase' || row.icon === 'box'
          ? { icon: row.icon }
          : {}),
      }))
      .filter((row) => row.tag && row.title && row.ctaLabel && row.ctaHref)
      .slice(0, 8);
    if (cards.length === 0) {
      throw new Error('Offer carousel needs at least one card.');
    }
    return {
      type: 'offerCarousel' as const,
      props: {
        ...(b.props.overline ? { overline: b.props.overline } : {}),
        ...(b.props.title ? { title: b.props.title } : {}),
        ...(b.props.subtitle ? { subtitle: b.props.subtitle } : {}),
        cards,
      },
    };
  }
  if (b.type === 'thinStrip') {
    const tone = (['blush', 'mint', 'sky', 'soft', 'gold'] as const).includes(
      b.props.tone as 'gold',
    )
      ? (b.props.tone as 'blush' | 'mint' | 'sky' | 'soft' | 'gold')
      : 'gold';
    const items = (b.props.items || '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 8);
    return {
      type: 'thinStrip' as const,
      props: {
        text: b.props.text || 'Limited-time offer',
        ...(items.length ? { items } : {}),
        ...(b.props.ctaLabel ? { ctaLabel: b.props.ctaLabel } : {}),
        ...(b.props.ctaHref ? { ctaHref: b.props.ctaHref } : {}),
        tone,
        ...(b.props.marquee === 'true' ? { marquee: true } : {}),
      },
    };
  }
  if (b.type === 'customSection') {
    const layout = parseCustomSectionLayout(b.props.layout);
    const bg = (
      ['default', 'surface', 'blush', 'mint', 'sky', 'lavender', 'soft'] as const
    ).includes(b.props.bg as 'blush')
      ? (b.props.bg as 'default' | 'surface' | 'blush' | 'mint' | 'sky' | 'lavender' | 'soft')
      : undefined;
    const width = (['page', 'narrow', 'full'] as const).includes(b.props.width as 'page')
      ? (b.props.width as 'page' | 'narrow' | 'full')
      : undefined;
    const minHeight = (['auto', 'sm', 'md', 'lg'] as const).includes(b.props.minHeight as 'md')
      ? (b.props.minHeight as 'auto' | 'sm' | 'md' | 'lg')
      : undefined;
    const radius = (['none', 'control', 'clay'] as const).includes(b.props.radius as 'none')
      ? (b.props.radius as 'none' | 'control' | 'clay')
      : undefined;
    return {
      type: 'customSection' as const,
      props: {
        ...(layout ? { layout } : {}),
        ...(b.props.overline ? { overline: b.props.overline } : {}),
        ...(b.props.title ? { title: b.props.title } : {}),
        ...(b.props.body ? { body: sanitizeArticleHtml(b.props.body) } : {}),
        ...(b.props.title2 ? { title2: b.props.title2 } : {}),
        ...(b.props.body2 ? { body2: sanitizeArticleHtml(b.props.body2) } : {}),
        ...(b.props.title3 ? { title3: b.props.title3 } : {}),
        ...(b.props.body3 ? { body3: sanitizeArticleHtml(b.props.body3) } : {}),
        ...(b.props.imageUrl ? { imageUrl: b.props.imageUrl } : {}),
        ...(b.props.imageUrl2 ? { imageUrl2: b.props.imageUrl2 } : {}),
        ...(b.props.imageUrl3 ? { imageUrl3: b.props.imageUrl3 } : {}),
        ...(b.props.ctaLabel ? { ctaLabel: b.props.ctaLabel } : {}),
        ...(b.props.ctaHref ? { ctaHref: b.props.ctaHref } : {}),
        ...(b.props.ctaLabel2 ? { ctaLabel2: b.props.ctaLabel2 } : {}),
        ...(b.props.ctaHref2 ? { ctaHref2: b.props.ctaHref2 } : {}),
        ...(bg && bg !== 'default' ? { bg } : {}),
        ...(b.props.bgImageUrl ? { bgImageUrl: b.props.bgImageUrl } : {}),
        ...(width && width !== 'page' ? { width } : {}),
        ...(minHeight && minHeight !== 'auto' ? { minHeight } : {}),
        ...(radius && radius !== 'none' ? { radius } : {}),
      },
    };
  }
  return {
    type: 'cta' as const,
    props: {
      label: b.props.label || 'Continue',
      href: b.props.href || '/',
      ...(b.props.variant === 'secondary' ? { variant: 'secondary' as const } : {}),
      ...(b.props.title ? { title: b.props.title } : {}),
      ...(b.props.body ? { body: b.props.body } : {}),
    },
  };
}

export function toPayload(blocks: Block[]) {
  return blocks.map((b) => attachStyle(payloadWithoutStyle(b), b.props));
}

export type CmsPreviewResult =
  | {
      ok: true;
      block: { id: string; type: string; sortOrder: number; props: Record<string, unknown> };
    }
  | { ok: false; error: string };

export function blockToCmsPreview(
  block: Block,
  extras?: Record<string, unknown>,
): CmsPreviewResult {
  try {
    const row = toPayload([block])[0];
    if (!row) return { ok: false, error: 'Invalid block' };
    return {
      ok: true,
      block: {
        id: block.clientId,
        type: row.type,
        sortOrder: 0,
        props: { ...row.props, ...extras },
      },
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Invalid block' };
  }
}

export const BLOCK_LABELS: Record<BlockType, string> = {
  hero: 'Hero',
  richText: 'Rich text',
  image: 'Image',
  productGrid: 'Product grid',
  cta: 'Call to action',
  spacer: 'Spacer',
  brandStrip: 'Brands',
  recipientSplit: 'Shop by baby',
  discoveryChips: 'Collections',
  buildYourBoxTeaser: 'Build your box',
  articleTeasers: 'Blogs',
  footer: 'Footer',
  saleStrip: 'Sale banner',
  faq: 'FAQ',
  exclusiveOffers: 'Offers',
  testimonials: 'Testimonials',
  countdown: 'Countdown',
  featuredCarousel: 'Featured carousel',
  whatsappCta: 'WhatsApp CTA',
  offerCarousel: 'Offer carousel',
  thinStrip: 'Thin sale strip',
  customSection: 'Custom section',
};

export const BLOCK_GROUPS: Array<{ id: string; label: string; types: BlockType[] }> = [
  { id: 'layout', label: 'Layout', types: ['image', 'richText', 'spacer', 'footer'] },
  {
    id: 'shop',
    label: 'Shop',
    types: [
      'featuredCarousel',
      'productGrid',
      'discoveryChips',
      'recipientSplit',
      'brandStrip',
      'buildYourBoxTeaser',
    ],
  },
  { id: 'stories', label: 'Stories', types: ['articleTeasers', 'faq', 'testimonials'] },
  {
    id: 'promo',
    label: 'Promo',
    types: [
      'saleStrip',
      'thinStrip',
      'exclusiveOffers',
      'offerCarousel',
      'countdown',
      'cta',
      'whatsappCta',
    ],
  },
];

export type PaletteInsert = {
  id: string;
  group: string;
  groupLabel: string;
  label: string;
  type: BlockType;
  props?: Record<string, string>;
};

function heroInsert(layout: HeroLayout): PaletteInsert {
  const textOnly = layout === 'fullText' || layout === 'splitCopy';
  const split = layout === 'splitMediaCopy' || layout === 'splitCopyMedia';
  return {
    id: `hero-${layout}`,
    group: 'hero',
    groupLabel: 'Hero',
    label: HERO_LAYOUT_LABELS[layout],
    type: 'hero',
    props: {
      layout,
      variant: textOnly ? 'panel' : 'storefront',
      ...(split
        ? {
            eyebrow: 'Personalised baby gifting',
            trustLine: defaultHeroTrustLine(),
          }
        : {}),
    },
  };
}

function customInsert(layout: CustomSectionLayout): PaletteInsert {
  return {
    id: `custom-${layout}`,
    group: 'custom',
    groupLabel: 'Custom',
    label: CUSTOM_SECTION_LAYOUT_LABELS[layout],
    type: 'customSection',
    props: { layout, minHeight: layout === 'stack' ? 'md' : 'auto' },
  };
}

export const PALETTE_INSERTS: PaletteInsert[] = [
  ...CUSTOM_SECTION_LAYOUTS.map(customInsert),
  ...HERO_LAYOUTS.map(heroInsert),
  ...BLOCK_GROUPS.flatMap((group) =>
    group.types.map((type) => ({
      id: type,
      group: group.id,
      groupLabel: group.label,
      label: BLOCK_LABELS[type],
      type,
    })),
  ),
];

export function createBlockFromInsert(insert: PaletteInsert): Block {
  return {
    clientId: newClientId(),
    type: insert.type,
    props: { ...EMPTY_PROPS[insert.type], ...insert.props },
  };
}

export function customVisibleKeys(layout: CustomSectionLayout | undefined): string[] {
  const chrome = ['layout', 'bg', 'bgImageUrl', 'width', 'minHeight', 'radius'];
  const copy = ['overline', 'title', 'body', 'ctaLabel', 'ctaHref', 'ctaLabel2', 'ctaHref2'];
  switch (layout) {
    case 'two':
      return [
        ...chrome,
        'title',
        'body',
        'ctaLabel',
        'ctaHref',
        'imageUrl',
        'title2',
        'body2',
        'ctaLabel2',
        'ctaHref2',
        'imageUrl2',
      ];
    case 'three':
      return [
        ...chrome,
        'title',
        'body',
        'imageUrl',
        'title2',
        'body2',
        'imageUrl2',
        'title3',
        'body3',
        'imageUrl3',
      ];
    case 'split':
    case 'splitReverse':
    case 'bleed':
      return [...chrome, ...copy, 'imageUrl'];
    default:
      return [...chrome, ...copy, 'imageUrl'];
  }
}

export function heroVisibleKeys(layout: HeroLayout | undefined): string[] {
  const copy = [
    'headline',
    'subcopy',
    'eyebrow',
    'ctaLabel',
    'ctaHref',
    'ctaLabel2',
    'ctaHref2',
    'trustLine',
    'accentWord',
  ];
  switch (layout) {
    case 'fullText':
      return ['layout', ...copy];
    case 'splitMedia':
      return [
        'layout',
        'imageUrl',
        'imageUrl2',
        'headline',
        'headline2',
        'ctaLabel',
        'ctaHref',
        'ctaLabel2',
        'ctaHref2',
      ];
    case 'splitCopy':
      return [
        'layout',
        'headline',
        'subcopy',
        'ctaLabel',
        'ctaHref',
        'headline2',
        'subcopy2',
        'ctaLabel2',
        'ctaHref2',
      ];
    case 'full':
    case 'splitMediaCopy':
    case 'splitCopyMedia':
    default:
      return ['layout', ...copy, 'imageUrl'];
  }
}

export const FIELD_LABELS: Record<string, string> = {
  headline: 'Headline',
  subcopy: 'Subcopy',
  eyebrow: 'Eyebrow',
  ctaLabel: 'Button',
  ctaHref: 'Button link',
  ctaLabel2: 'Second button',
  ctaHref2: 'Second button link',
  trustLine: 'Trust chips',
  imageUrl: 'Image',
  imageUrl2: 'Second image',
  headline2: 'Second headline',
  subcopy2: 'Second subcopy',
  layout: 'Layout',
  variant: 'Variant',
  html: 'Content',
  url: 'Image',
  alt: 'Alt text',
  caption: 'Caption',
  title: 'Title',
  overline: 'Overline',
  subtitle: 'Subtitle',
  label: 'Label',
  href: 'Link',
  body: 'Body',
  size: 'Size',
  text: 'Text',
  tone: 'Tone',
  itemsJson: 'Items',
  cardsJson: 'Cards',
  endsAt: 'Ends at',
  expiredLabel: 'Expired label',
  accentWord: 'Accent word',
  countryCode: 'Country code',
  placeholder: 'Placeholder',
  disclaimer: 'Disclaimer',
  marquee: 'Marquee',
  imageAlt: 'Image alt',
  imageFit: 'Image fit',
  steps: 'Steps',
  brands: 'Brands',
  usps: 'USPs',
  showUsps: 'Show USPs',
  uspColumns: 'USP columns',
  grid: 'Tile layout',
  columns: 'Columns',
  display: 'Quotes',
  quoteColumns: 'Quote columns',
  seeAllHref: 'See-all link',
  seeAllLabel: 'See-all label',
  limit: 'Limit',
  items: 'Items',
  itemsSource: 'Items source',
  brandName: 'Brand name',
  tagline: 'Tagline',
  shopLinks: 'Shop links',
  companyLinks: 'Company links',
  bg: 'Background',
  bgImageUrl: 'Background media',
  width: 'Width',
  minHeight: 'Min height',
  radius: 'Corners',
  title2: 'Second title',
  body2: 'Second body',
  title3: 'Third title',
  body3: 'Third body',
  imageUrl3: 'Third image',
};

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function blockLabel(type: BlockType, layout?: string): string {
  if (type === 'hero') {
    const parsed = parseHeroLayout(layout);
    return parsed ? `Hero · ${HERO_LAYOUT_LABELS[parsed]}` : 'Hero';
  }
  if (type === 'customSection') {
    const parsed = parseCustomSectionLayout(layout);
    return parsed ? `Custom · ${CUSTOM_SECTION_LAYOUT_LABELS[parsed]}` : 'Custom section';
  }
  return BLOCK_LABELS[type] ?? type;
}

export function fieldLabel(key: string): string {
  return FIELD_LABELS[key] ?? key;
}

export function blockSummary(block: Block): string {
  const p = block.props;
  switch (block.type) {
    case 'hero': {
      const layout = parseHeroLayout(p.layout);
      const layoutBit = layout ? HERO_LAYOUT_LABELS[layout] : '';
      const text = p.headline?.trim() || '';
      if (layoutBit && text) return `${layoutBit} · ${text}`;
      return text || layoutBit;
    }
    case 'customSection': {
      const layout = parseCustomSectionLayout(p.layout);
      const layoutBit = layout ? CUSTOM_SECTION_LAYOUT_LABELS[layout] : 'Blank';
      const text = p.title?.trim() || stripHtml(p.body || '').slice(0, 48);
      if (text) return `${layoutBit} · ${text}`;
      return layoutBit;
    }
    case 'saleStrip':
      return p.text?.trim() || '';
    case 'productGrid':
      return p.title?.trim() || p.source || '';
    case 'richText':
      return stripHtml(p.html || '').slice(0, 72);
    case 'cta':
      return p.title?.trim() || p.label?.trim() || '';
    case 'image':
      return p.alt?.trim() || p.caption?.trim() || '';
    case 'faq':
      return p.title?.trim() || '';
    case 'testimonials':
      return p.title?.trim() || '';
    case 'exclusiveOffers':
      return p.title?.trim() || '';
    case 'countdown':
      return p.title?.trim() || '';
    case 'featuredCarousel':
      return p.headline?.trim() || '';
    case 'whatsappCta':
      return p.title?.trim() || '';
    case 'offerCarousel':
      return p.title?.trim() || '';
    case 'thinStrip':
      return p.text?.trim() || '';
    case 'discoveryChips':
      return p.title?.trim() || '';
    case 'brandStrip':
      return p.title?.trim() || '';
    case 'recipientSplit':
      return p.title?.trim() || '';
    case 'buildYourBoxTeaser':
      return p.title?.trim() || '';
    case 'articleTeasers':
      return p.title?.trim() || '';
    case 'footer':
      return p.brandName?.trim() || '';
    case 'spacer':
      return p.size || 'md';
    default:
      return '';
  }
}

export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

export function duplicateSlug(slug: string): string {
  const base = slug.replace(/-copy(?:-\d+)?$/, '');
  return `${base}-copy-${Date.now().toString().slice(-6)}`.slice(0, 80);
}

export function isHomepagePage(page: Pick<MarketingPage, 'slug' | 'isHomepage'>): boolean {
  return page.slug === 'home' || Boolean(page.isHomepage);
}
