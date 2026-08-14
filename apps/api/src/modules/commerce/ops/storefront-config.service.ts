import { Injectable } from '@nestjs/common';
import type { GiftChromeBody } from '@inabiya/validation';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';

const FEATURED_KEY = 'homepage.featured_slugs';
const HERO_TITLE_KEY = 'homepage.hero_title';
const HERO_SUBTITLE_KEY = 'homepage.hero_subtitle';
const GIFT_CHROME_KEY = 'gift.chrome';

/** Old seed was BYB + hampers only (no groups). Treat as unset so CMS defaults apply. */
function isLegacySlimShop(links: GiftChromeBody['shopLinks']): boolean {
  if (!links?.length) return true;
  if (links.length > 2) return false;
  if (links.some((l) => l.group)) return false;
  return links.every((l) => {
    const p = String(l.href ?? '')
      .split(/[?#]/, 1)[0]
      ?.replace(/\/$/, '');
    return p === '/gift/build-your-box' || p?.endsWith('/ready-hampers') || p?.endsWith('/hampers');
  });
}

export type StorefrontHomeConfig = {
  featuredSlugs: string[];
  heroTitle: string;
  heroSubtitle: string;
};

export const DEFAULT_GIFT_CHROME: Required<Pick<GiftChromeBody, 'shopLinks' | 'forWhomLinks'>> &
  GiftChromeBody = {
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
    { href: '/gift/collections/first-birthday', label: 'First birthday gifts', group: 'Occasion' },
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
    brandHref: '/gift',
    tagline: 'Thoughtfully personalised baby essentials & gifting.',
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
      { label: 'Shipping', href: '/gift#faq' },
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

@Injectable()
export class StorefrontConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

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

  async setHomeConfig(
    input: {
      featuredSlugs: string[];
      heroTitle?: string;
      heroSubtitle?: string;
    },
    actorId: string,
    requestId?: string,
  ): Promise<StorefrontHomeConfig> {
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
    await this.audit.write({
      actorId,
      action: 'storefront.setHomeConfig',
      resource: 'commerce_setting',
      resourceId: FEATURED_KEY,
      metadata: { slugCount: input.featuredSlugs.length },
      requestId,
    });
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
      shopLabel: stored.shopLabel?.trim() || DEFAULT_GIFT_CHROME.shopLabel,
      forWhomLabel: stored.forWhomLabel?.trim() || DEFAULT_GIFT_CHROME.forWhomLabel,
      journalLabel: stored.journalLabel?.trim() || DEFAULT_GIFT_CHROME.journalLabel,
      journalHref: stored.journalHref?.trim() || DEFAULT_GIFT_CHROME.journalHref,
      shopLinks: isLegacySlimShop(stored.shopLinks)
        ? DEFAULT_GIFT_CHROME.shopLinks
        : stored.shopLinks,
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
        socialLinks: Array.isArray(stored.footer?.socialLinks)
          ? stored.footer.socialLinks
          : DEFAULT_GIFT_CHROME.footer?.socialLinks,
        reachLinks: Array.isArray(stored.footer?.reachLinks)
          ? stored.footer.reachLinks
          : DEFAULT_GIFT_CHROME.footer?.reachLinks,
        legalLinks: Array.isArray(stored.footer?.legalLinks)
          ? stored.footer.legalLinks
          : DEFAULT_GIFT_CHROME.footer?.legalLinks,
        showNewsletter:
          stored.footer?.showNewsletter ?? DEFAULT_GIFT_CHROME.footer?.showNewsletter ?? true,
      },
    };
  }

  async setGiftChrome(
    input: GiftChromeBody,
    actorId: string,
    requestId?: string,
  ): Promise<GiftChromeBody> {
    const current = await this.getGiftChrome();
    const next: GiftChromeBody = {
      shopLabel: input.shopLabel ?? current.shopLabel,
      forWhomLabel: input.forWhomLabel ?? current.forWhomLabel,
      journalLabel: input.journalLabel ?? current.journalLabel,
      journalHref: input.journalHref ?? current.journalHref,
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
            socialLinks: input.footer.socialLinks ?? current.footer?.socialLinks,
            reachLinks: input.footer.reachLinks ?? current.footer?.reachLinks,
            legalLinks: input.footer.legalLinks ?? current.footer?.legalLinks,
            showNewsletter: input.footer.showNewsletter ?? current.footer?.showNewsletter ?? true,
          }
        : current.footer,
    };
    await this.prisma.commerceSetting.upsert({
      where: { key: GIFT_CHROME_KEY },
      create: { key: GIFT_CHROME_KEY, value: next },
      update: { value: next },
    });
    await this.audit.write({
      actorId,
      action: 'storefront.setGiftChrome',
      resource: 'commerce_setting',
      resourceId: GIFT_CHROME_KEY,
      requestId,
    });
    return this.getGiftChrome();
  }
}
