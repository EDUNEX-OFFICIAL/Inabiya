import { Injectable } from '@nestjs/common';
import type { GiftChromeBody } from '@inabiya/validation';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

const FEATURED_KEY = 'homepage.featured_slugs';
const HERO_TITLE_KEY = 'homepage.hero_title';
const HERO_SUBTITLE_KEY = 'homepage.hero_subtitle';
const GIFT_CHROME_KEY = 'gift.chrome';

export type StorefrontHomeConfig = {
  featuredSlugs: string[];
  heroTitle: string;
  heroSubtitle: string;
};

export const DEFAULT_GIFT_CHROME: Required<Pick<GiftChromeBody, 'shopLinks' | 'forWhomLinks'>> &
  GiftChromeBody = {
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
  shopMega: {
    headline: 'Shop the Soft Gift edit',
    body: 'Build a box or browse ready-made hampers — curated for new parents.',
    ctaHref: '/gift/products',
    ctaLabel: 'Browse all gifts',
    imageSrc: '/gift/nav/shop.svg',
  },
  forWhomMega: {
    headline: 'Gifts by little one',
    body: 'Filter by recipient or age band — unisex-safe picks included.',
    ctaHref: '/gift/products',
    ctaLabel: 'Shop all',
    imageSrc: '/gift/nav/for-whom.svg',
  },
  footer: {
    brandName: 'Inabiya',
    tagline: 'Thoughtfully personalised baby essentials & gifting.',
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
        title: 'Company',
        links: [
          { label: 'Parenting Blog', href: '/articles' },
          { label: 'Our Specialists', href: '/specialists' },
          { label: 'Contact', href: 'mailto:hello@inabiya.in' },
        ],
      },
    ],
  },
};

@Injectable()
export class StorefrontConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async getHomeConfig(): Promise<StorefrontHomeConfig> {
    const rows = await this.prisma.commerceSetting.findMany({
      where: {
        key: { in: [FEATURED_KEY, HERO_TITLE_KEY, HERO_SUBTITLE_KEY] },
      },
    });
    const map = new Map(rows.map((r) => [r.key, r.value]));
    const slugs = map.get(FEATURED_KEY);
    return {
      featuredSlugs: Array.isArray(slugs) ? (slugs as string[]) : [],
      heroTitle: (map.get(HERO_TITLE_KEY) as string) ?? 'Gift',
      heroSubtitle:
        (map.get(HERO_SUBTITLE_KEY) as string) ??
        'Soft Gift storefront — browse curated baby gifts and build your box.',
    };
  }

  async setHomeConfig(input: {
    featuredSlugs: string[];
    heroTitle?: string;
    heroSubtitle?: string;
  }): Promise<StorefrontHomeConfig> {
    await this.prisma.commerceSetting.upsert({
      where: { key: FEATURED_KEY },
      create: { key: FEATURED_KEY, value: input.featuredSlugs },
      update: { value: input.featuredSlugs },
    });
    if (input.heroTitle != null) {
      await this.prisma.commerceSetting.upsert({
        where: { key: HERO_TITLE_KEY },
        create: { key: HERO_TITLE_KEY, value: input.heroTitle },
        update: { value: input.heroTitle },
      });
    }
    if (input.heroSubtitle != null) {
      await this.prisma.commerceSetting.upsert({
        where: { key: HERO_SUBTITLE_KEY },
        create: { key: HERO_SUBTITLE_KEY, value: input.heroSubtitle },
        update: { value: input.heroSubtitle },
      });
    }
    return this.getHomeConfig();
  }

  async getGiftChrome(): Promise<GiftChromeBody> {
    const row = await this.prisma.commerceSetting.findUnique({
      where: { key: GIFT_CHROME_KEY },
    });
    const stored =
      row?.value && typeof row.value === 'object' && !Array.isArray(row.value)
        ? (row.value as GiftChromeBody)
        : {};
    return {
      shopLinks: stored.shopLinks?.length ? stored.shopLinks : DEFAULT_GIFT_CHROME.shopLinks,
      forWhomLinks: stored.forWhomLinks?.length
        ? stored.forWhomLinks
        : DEFAULT_GIFT_CHROME.forWhomLinks,
      shopMega: { ...DEFAULT_GIFT_CHROME.shopMega, ...stored.shopMega },
      forWhomMega: { ...DEFAULT_GIFT_CHROME.forWhomMega, ...stored.forWhomMega },
      footer: {
        ...DEFAULT_GIFT_CHROME.footer,
        ...stored.footer,
        columns: stored.footer?.columns?.length
          ? stored.footer.columns
          : DEFAULT_GIFT_CHROME.footer?.columns,
      },
    };
  }

  async setGiftChrome(input: GiftChromeBody): Promise<GiftChromeBody> {
    const current = await this.getGiftChrome();
    const next: GiftChromeBody = {
      shopLinks: input.shopLinks ?? current.shopLinks,
      forWhomLinks: input.forWhomLinks ?? current.forWhomLinks,
      shopMega: input.shopMega ? { ...current.shopMega, ...input.shopMega } : current.shopMega,
      forWhomMega: input.forWhomMega
        ? { ...current.forWhomMega, ...input.forWhomMega }
        : current.forWhomMega,
      footer: input.footer
        ? {
            ...current.footer,
            ...input.footer,
            columns: input.footer.columns ?? current.footer?.columns,
          }
        : current.footer,
    };
    await this.prisma.commerceSetting.upsert({
      where: { key: GIFT_CHROME_KEY },
      create: { key: GIFT_CHROME_KEY, value: next },
      update: { value: next },
    });
    return this.getGiftChrome();
  }
}
