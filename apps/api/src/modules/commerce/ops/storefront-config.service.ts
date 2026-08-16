import { Injectable } from '@nestjs/common';
import type { GiftChromeBody } from '@inabiya/validation';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';

const GIFT_CHROME_KEY = 'gift.chrome';

/** Dev hard-cut: strip storefront `/gift` URL prefix from stored chrome hrefs (assets under `/gift/media|nav|brands` kept). */
function rewriteGiftRouteHref(href: string | undefined | null): string | undefined {
  if (href == null) return undefined;
  const s = String(href);
  if (
    s.startsWith('/gift/media/') ||
    s.startsWith('/gift/nav/') ||
    s.startsWith('/gift/brands/') ||
    s.startsWith('/gift/gifting-bg')
  ) {
    return s;
  }
  if (s === '/gift' || s.startsWith('/gift/') || s.startsWith('/gift?') || s.startsWith('/gift#')) {
    return s.replace(/^\/gift/, '') || '/';
  }
  return s;
}

function rewriteChromeHrefs<T>(value: T): T {
  if (value == null || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.map((v) => rewriteChromeHrefs(v)) as T;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if ((k === 'href' || k === 'ctaHref' || k === 'imageSrc' || k === 'journalHref') && typeof v === 'string') {
      out[k] = rewriteGiftRouteHref(v) ?? v;
    } else {
      out[k] = rewriteChromeHrefs(v);
    }
  }
  return out as T;
}

/** Old seed was BYB + hampers only (no groups). Treat as unset so CMS defaults apply. */
function isLegacySlimShop(links: GiftChromeBody['shopLinks']): boolean {
  if (!links?.length) return true;
  if (links.length > 2) return false;
  if (links.some((l) => l.group)) return false;
  return links.every((l) => {
    const p = String(l.href ?? '')
      .split(/[?#]/, 1)[0]
      ?.replace(/\/$/, '');
    return p === '/build-your-box' || p?.endsWith('/ready-hampers') || p?.endsWith('/hampers');
  });
}

export const DEFAULT_GIFT_CHROME: Required<Pick<GiftChromeBody, 'shopLinks' | 'forWhomLinks'>> &
  GiftChromeBody = {
  navItems: [
    {
      id: 'shop',
      label: 'Shop',
      type: 'mega',
      links: [
        { href: '/build-your-box', label: 'Build Your Box', group: 'Shop' },
        { href: '/collections/ready-hampers', label: 'Ready-Made Hampers', group: 'Shop' },
        { href: '/collections/welcome-baby', label: 'Welcome baby gifts', group: 'Occasion' },
        { href: '/collections/baby-shower', label: 'Baby shower gifts', group: 'Occasion' },
        {
          href: '/collections/naming-ceremony',
          label: 'Naming ceremony gifts',
          group: 'Occasion',
        },
        {
          href: '/collections/first-birthday',
          label: 'First birthday gifts',
          group: 'Occasion',
        },
        { href: '/collections/bestsellers', label: 'Best sellers', group: 'Curated' },
        { href: '/collections/editors-picks', label: "Editor's picks", group: 'Curated' },
        { href: '/collections/new-arrivals', label: 'New arrivals', group: 'Curated' },
        { href: '/collections/on-sale', label: 'On sale', group: 'Curated' },
      ],
      mega: {
        headline: 'Shop the Soft Gift edit',
        body: 'Build a box or browse ready-made hampers — curated for new parents.',
        ctaHref: '/products',
        ctaLabel: 'Browse all gifts',
        imageSrc: '/gift/nav/shop.svg',
      },
    },
    {
      id: 'for-whom',
      label: 'For Whom',
      type: 'mega',
      links: [
        { href: '/collections/for-baby-girl', label: 'Baby Girl', group: 'For baby' },
        { href: '/collections/for-baby-boy', label: 'Baby Boy', group: 'For baby' },
        {
          href: '/collections/for-expecting-mom',
          label: 'Expecting Mom',
          group: 'For baby',
        },
        { href: '/collections/unisex-gifts', label: 'Unisex', group: 'For baby' },
        { href: '/collections/newborn', label: 'Newborn', group: 'By age' },
        { href: '/collections/infant', label: 'Infant', group: 'By age' },
        { href: '/collections/toddler', label: 'Toddler', group: 'By age' },
      ],
      mega: {
        headline: 'Gifts by little one',
        body: 'Filter by recipient or age band — unisex-safe picks included.',
        ctaHref: '/products',
        ctaLabel: 'Shop all',
        imageSrc: '/gift/nav/for-whom.svg',
      },
    },
    { id: 'journal', label: 'Journal', type: 'link', href: '/articles' },
  ],
  shopLabel: 'Shop',
  forWhomLabel: 'For Whom',
  journalLabel: 'Journal',
  journalHref: '/articles',
  shopLinks: [
    { href: '/build-your-box', label: 'Build Your Box', group: 'Shop' },
    { href: '/collections/ready-hampers', label: 'Ready-Made Hampers', group: 'Shop' },
    { href: '/collections/welcome-baby', label: 'Welcome baby gifts', group: 'Occasion' },
    { href: '/collections/baby-shower', label: 'Baby shower gifts', group: 'Occasion' },
    {
      href: '/collections/naming-ceremony',
      label: 'Naming ceremony gifts',
      group: 'Occasion',
    },
    { href: '/collections/first-birthday', label: 'First birthday gifts', group: 'Occasion' },
    { href: '/collections/bestsellers', label: 'Best sellers', group: 'Curated' },
    { href: '/collections/editors-picks', label: "Editor's picks", group: 'Curated' },
    { href: '/collections/new-arrivals', label: 'New arrivals', group: 'Curated' },
    { href: '/collections/on-sale', label: 'On sale', group: 'Curated' },
  ],
  forWhomLinks: [
    { href: '/collections/for-baby-girl', label: 'Baby Girl', group: 'For baby' },
    { href: '/collections/for-baby-boy', label: 'Baby Boy', group: 'For baby' },
    { href: '/collections/for-expecting-mom', label: 'Expecting Mom', group: 'For baby' },
    { href: '/collections/unisex-gifts', label: 'Unisex', group: 'For baby' },
    { href: '/collections/newborn', label: 'Newborn', group: 'By age' },
    { href: '/collections/infant', label: 'Infant', group: 'By age' },
    { href: '/collections/toddler', label: 'Toddler', group: 'By age' },
  ],
  shopMega: {
    headline: 'Shop the Soft Gift edit',
    body: 'Build a box or browse ready-made hampers — curated for new parents.',
    ctaHref: '/products',
    ctaLabel: 'Browse all gifts',
    imageSrc: '/gift/nav/shop.svg',
  },
  forWhomMega: {
    headline: 'Gifts by little one',
    body: 'Filter by recipient or age band — unisex-safe picks included.',
    ctaHref: '/products',
    ctaLabel: 'Shop all',
    imageSrc: '/gift/nav/for-whom.svg',
  },
  footer: {
    brandName: 'Inabiya',
    brandHref: '/',
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
      { label: 'Shipping', href: '/#faq' },
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
          { label: 'Build Your Box', href: '/build-your-box' },
          { label: 'Ready-Made Hampers', href: '/collections/ready-hampers' },
          { label: 'Shop by Age', href: '/collections/newborn' },
          { label: 'Corporate Gifting', href: '/corporate' },
        ],
      },
      {
        title: 'Help',
        links: [
          { label: 'Shipping', href: '/#faq' },
          { label: 'Returns', href: '/#faq' },
          { label: 'FAQ', href: '/#faq' },
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

  async getGiftChrome(): Promise<GiftChromeBody> {
    const row = await this.prisma.commerceSetting.findUnique({
      where: { key: GIFT_CHROME_KEY },
    });
    const stored =
      row?.value && typeof row.value === 'object' && !Array.isArray(row.value)
        ? rewriteChromeHrefs(row.value as GiftChromeBody)
        : {};
    return {
      navItems: stored.navItems?.length ? stored.navItems : DEFAULT_GIFT_CHROME.navItems,
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
      navItems: input.navItems ?? current.navItems,
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
