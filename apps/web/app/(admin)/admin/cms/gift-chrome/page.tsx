'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink, Loader2, Plus, Trash2 } from 'lucide-react';
import { apiAuth, getStoredAccessToken, loginUrl } from '@/lib/auth-client';
import { OpsPageHeader } from '@/components/commerce-ops/ops-page-header';
import { GiftNavLinksEditor, compactNavLinks, type NavLinkRow } from './nav-links-editor';
import {
  GiftFooterColumnsEditor,
  GiftFooterLinkListEditor,
  compactChromeLinks,
  compactFooterColumns,
  type ChromeLinkRow,
  type FooterColRow,
} from './footer-editor';
import {
  composeCopyrightTpl,
  formatFooterCopyright,
  parseCopyrightTpl,
  type CopyrightParts,
} from '@/lib/gift-footer-chrome';

type Mega = {
  headline: string;
  body: string;
  ctaHref: string;
  ctaLabel: string;
  imageSrc: string;
};

type TopNavItem = {
  id: string;
  label: string;
  type: 'link' | 'mega';
  href?: string;
  links?: NavLinkRow[];
  mega?: Mega;
};

type Chrome = {
  navItems?: TopNavItem[];
  shopLabel?: string;
  forWhomLabel?: string;
  journalLabel?: string;
  journalHref?: string;
  shopLinks: NavLinkRow[];
  forWhomLinks: NavLinkRow[];
  shopMega: Mega;
  forWhomMega: Mega;
  footer: {
    brandName?: string;
    brandHref?: string;
    tagline?: string;
    columns?: FooterColRow[];
    socialLinks?: ChromeLinkRow[];
    reachTitle?: string;
    reachLinks?: ChromeLinkRow[];
    legalLinks?: ChromeLinkRow[];
    copyright?: string;
    newsletterTitle?: string;
    newsletterHint?: string;
    showNewsletter?: boolean;
  };
};

type TabId = 'navbar' | 'footer';

const INPUT = 'clay-input mt-1 block w-full text-sm';
const DEFAULT_SHOP_MEGA: Mega = {
  headline: 'Shop the Soft Gift edit',
  body: 'Build a box or browse ready-made hampers — curated for new parents.',
  ctaHref: '/gift/products',
  ctaLabel: 'Browse all gifts',
  imageSrc: '/gift/nav/shop.svg',
};
const DEFAULT_WHOM_MEGA: Mega = {
  headline: 'Gifts by little one',
  body: 'Filter by recipient or age band — unisex-safe picks included.',
  ctaHref: '/gift/products',
  ctaLabel: 'Shop all',
  imageSrc: '/gift/nav/for-whom.svg',
};

const DEFAULT_SHOP: NavLinkRow[] = [
  { href: '/gift/build-your-box', label: 'Build Your Box', group: 'Shop' },
  { href: '/gift/collections/ready-hampers', label: 'Ready-Made Hampers', group: 'Shop' },
  { href: '/gift/collections/welcome-baby', label: 'Welcome baby gifts', group: 'Occasion' },
  { href: '/gift/collections/baby-shower', label: 'Baby shower gifts', group: 'Occasion' },
  { href: '/gift/collections/naming-ceremony', label: 'Naming ceremony gifts', group: 'Occasion' },
  { href: '/gift/collections/first-birthday', label: 'First birthday gifts', group: 'Occasion' },
  { href: '/gift/collections/bestsellers', label: 'Best sellers', group: 'Curated' },
  { href: '/gift/collections/editors-picks', label: "Editor's picks", group: 'Curated' },
  { href: '/gift/collections/new-arrivals', label: 'New arrivals', group: 'Curated' },
  { href: '/gift/collections/on-sale', label: 'On sale', group: 'Curated' },
];

const DEFAULT_WHOM: NavLinkRow[] = [
  { href: '/gift/collections/for-baby-girl', label: 'Baby Girl', group: 'For baby' },
  { href: '/gift/collections/for-baby-boy', label: 'Baby Boy', group: 'For baby' },
  { href: '/gift/collections/for-expecting-mom', label: 'Expecting Mom', group: 'For baby' },
  { href: '/gift/collections/unisex-gifts', label: 'Unisex', group: 'For baby' },
  { href: '/gift/collections/newborn', label: 'Newborn', group: 'By age' },
  { href: '/gift/collections/infant', label: 'Infant', group: 'By age' },
  { href: '/gift/collections/toddler', label: 'Toddler', group: 'By age' },
];

const DEFAULT_NAV_ITEMS: TopNavItem[] = [
  { id: 'shop', label: 'Shop', type: 'mega', links: DEFAULT_SHOP, mega: DEFAULT_SHOP_MEGA },
  {
    id: 'for-whom',
    label: 'For Whom',
    type: 'mega',
    links: DEFAULT_WHOM,
    mega: DEFAULT_WHOM_MEGA,
  },
  { id: 'journal', label: 'Journal', type: 'link', href: '/articles' },
];

function compactNavItems(items: TopNavItem[]): TopNavItem[] {
  return items.flatMap<TopNavItem>((item, index) => {
    const label = item.label.trim();
    if (!label) return [];
    const id =
      item.id
        .trim()
        .replace(/[^a-zA-Z0-9_-]/g, '-')
        .slice(0, 48) || `item-${index + 1}`;
    if (item.type === 'link') {
      const href = item.href?.trim();
      return href ? [{ id, label, type: 'link' as const, href }] : [];
    }
    const links = compactNavLinks(item.links ?? []);
    return links.length ? [{ id, label, type: 'mega' as const, links, mega: item.mega }] : [];
  });
}

const DEFAULT_FOOTER_COLS: FooterColRow[] = [
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
];

const DEFAULT_SOCIAL: ChromeLinkRow[] = [
  { label: 'Instagram', href: 'https://instagram.com/inabiya', network: 'instagram' },
  { label: 'Facebook', href: 'https://facebook.com/inabiya', network: 'facebook' },
  { label: 'WhatsApp', href: 'https://wa.me/919693940330', network: 'whatsapp' },
];

const DEFAULT_REACH: ChromeLinkRow[] = [
  { label: 'hello@inabiya.in', href: 'mailto:hello@inabiya.in', network: 'mail' },
  { label: 'WhatsApp', href: 'https://wa.me/919693940330', network: 'whatsapp' },
  { label: '@inabiya', href: 'https://instagram.com/inabiya', network: 'instagram' },
];

const DEFAULT_LEGAL: ChromeLinkRow[] = [
  { label: 'Privacy', href: '/privacy-policy' },
  { label: 'Contact', href: '/contact' },
];

function SectionCard({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <details
      className="group rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]"
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary className="cursor-pointer px-3 py-3 text-sm font-semibold marker:text-[var(--muted-foreground)] sm:px-4">
        {title}
      </summary>
      <div className="border-t border-[var(--border-subtle)] p-3 sm:p-4">{children}</div>
    </details>
  );
}

function Field({
  label,
  children,
  className = '',
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="text-xs font-medium">{label}</span>
      {children}
    </label>
  );
}

function MegaFields({ value, onChange }: { value: Mega; onChange: (next: Mega) => void }) {
  return (
    <details className="rounded-lg border border-[var(--border-subtle)] bg-[var(--background)] p-3">
      <summary className="cursor-pointer text-xs font-medium text-[var(--muted-foreground)]">
        Menu preview card
      </summary>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <Field label="Headline" className="sm:col-span-2">
          <input
            className={INPUT}
            value={value.headline}
            onChange={(e) => onChange({ ...value, headline: e.target.value })}
          />
        </Field>
        <Field label="Text" className="sm:col-span-2">
          <input
            className={INPUT}
            value={value.body}
            onChange={(e) => onChange({ ...value, body: e.target.value })}
          />
        </Field>
        <Field label="Button">
          <input
            className={INPUT}
            value={value.ctaLabel}
            onChange={(e) => onChange({ ...value, ctaLabel: e.target.value })}
          />
        </Field>
        <Field label="Button link">
          <input
            className={`${INPUT} font-mono text-xs`}
            value={value.ctaHref}
            onChange={(e) => onChange({ ...value, ctaHref: e.target.value })}
          />
        </Field>
        <Field label="Image URL" className="sm:col-span-2">
          <input
            className={`${INPUT} font-mono text-xs`}
            value={value.imageSrc}
            onChange={(e) => onChange({ ...value, imageSrc: e.target.value })}
          />
        </Field>
      </div>
    </details>
  );
}

export default function GiftChromeAdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>('navbar');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [shopLabel, setShopLabel] = useState('Shop');
  const [forWhomLabel, setForWhomLabel] = useState('For Whom');
  const [journalLabel, setJournalLabel] = useState('Journal');
  const [journalHref, setJournalHref] = useState('/articles');
  const [navItems, setNavItems] = useState<TopNavItem[]>(DEFAULT_NAV_ITEMS);
  const [shopLinks, setShopLinks] = useState<NavLinkRow[]>([]);
  const [whomLinks, setWhomLinks] = useState<NavLinkRow[]>([]);
  const [collections, setCollections] = useState<Array<{ slug: string; title: string }>>([]);
  const [shopMega, setShopMega] = useState<Mega>(DEFAULT_SHOP_MEGA);
  const [whomMega, setWhomMega] = useState<Mega>(DEFAULT_WHOM_MEGA);
  const [brandName, setBrandName] = useState('Inabiya');
  const [brandHref, setBrandHref] = useState('/gift');
  const [tagline, setTagline] = useState('');
  const [copyrightParts, setCopyrightParts] = useState<CopyrightParts>(() =>
    parseCopyrightTpl(undefined),
  );
  const [footerColumns, setFooterColumns] = useState<FooterColRow[]>(DEFAULT_FOOTER_COLS);
  const [socialLinks, setSocialLinks] = useState<ChromeLinkRow[]>(DEFAULT_SOCIAL);
  const [reachTitle, setReachTitle] = useState('Reach us');
  const [reachLinks, setReachLinks] = useState<ChromeLinkRow[]>(DEFAULT_REACH);
  const [legalLinks, setLegalLinks] = useState<ChromeLinkRow[]>(DEFAULT_LEGAL);
  const [newsletterTitle, setNewsletterTitle] = useState('Stay in the loop');
  const [newsletterHint, setNewsletterHint] = useState(
    'New drops & gentle parenting notes — no spam.',
  );
  const [showNewsletter, setShowNewsletter] = useState(true);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace(loginUrl('/admin/cms/gift-chrome'));
      return;
    }
    apiAuth<Chrome>('/admin/commerce/gift-chrome')
      .then((c) => {
        setNavItems(
          c.navItems?.length
            ? c.navItems.map((item) => ({
                ...item,
                links: item.links ?? [],
                mega: item.mega ?? DEFAULT_SHOP_MEGA,
              }))
            : [
                {
                  id: 'shop',
                  label: c.shopLabel?.trim() || 'Shop',
                  type: 'mega',
                  links: c.shopLinks?.length ? c.shopLinks : DEFAULT_SHOP,
                  mega: c.shopMega ?? DEFAULT_SHOP_MEGA,
                },
                {
                  id: 'for-whom',
                  label: c.forWhomLabel?.trim() || 'For Whom',
                  type: 'mega',
                  links: c.forWhomLinks?.length ? c.forWhomLinks : DEFAULT_WHOM,
                  mega: c.forWhomMega ?? DEFAULT_WHOM_MEGA,
                },
                {
                  id: 'journal',
                  label: c.journalLabel?.trim() || 'Journal',
                  type: 'link',
                  href: c.journalHref?.trim() || '/articles',
                },
              ],
        );
        setShopLabel(c.shopLabel?.trim() || 'Shop');
        setForWhomLabel(c.forWhomLabel?.trim() || 'For Whom');
        setJournalLabel(c.journalLabel?.trim() || 'Journal');
        setJournalHref(c.journalHref?.trim() || '/articles');
        setShopLinks(c.shopLinks?.length ? c.shopLinks : DEFAULT_SHOP);
        setWhomLinks(c.forWhomLinks?.length ? c.forWhomLinks : DEFAULT_WHOM);
        setShopMega({
          headline: c.shopMega?.headline || DEFAULT_SHOP_MEGA.headline,
          body: c.shopMega?.body || DEFAULT_SHOP_MEGA.body,
          ctaHref: c.shopMega?.ctaHref || DEFAULT_SHOP_MEGA.ctaHref,
          ctaLabel: c.shopMega?.ctaLabel || DEFAULT_SHOP_MEGA.ctaLabel,
          imageSrc: c.shopMega?.imageSrc || DEFAULT_SHOP_MEGA.imageSrc,
        });
        setWhomMega({
          headline: c.forWhomMega?.headline || DEFAULT_WHOM_MEGA.headline,
          body: c.forWhomMega?.body || DEFAULT_WHOM_MEGA.body,
          ctaHref: c.forWhomMega?.ctaHref || DEFAULT_WHOM_MEGA.ctaHref,
          ctaLabel: c.forWhomMega?.ctaLabel || DEFAULT_WHOM_MEGA.ctaLabel,
          imageSrc: c.forWhomMega?.imageSrc || DEFAULT_WHOM_MEGA.imageSrc,
        });
        setBrandName(c.footer?.brandName ?? 'Inabiya');
        setBrandHref(c.footer?.brandHref?.trim() || '/gift');
        setTagline(c.footer?.tagline ?? '');
        setCopyrightParts(parseCopyrightTpl(c.footer?.copyright));
        setFooterColumns(c.footer?.columns?.length ? c.footer.columns : DEFAULT_FOOTER_COLS);
        setSocialLinks(
          Array.isArray(c.footer?.socialLinks) ? c.footer.socialLinks : DEFAULT_SOCIAL,
        );
        setReachTitle(c.footer?.reachTitle?.trim() || 'Reach us');
        setReachLinks(Array.isArray(c.footer?.reachLinks) ? c.footer.reachLinks : DEFAULT_REACH);
        setLegalLinks(Array.isArray(c.footer?.legalLinks) ? c.footer.legalLinks : DEFAULT_LEGAL);
        setNewsletterTitle(c.footer?.newsletterTitle?.trim() || 'Stay in the loop');
        setNewsletterHint(
          c.footer?.newsletterHint?.trim() || 'New drops & gentle parenting notes — no spam.',
        );
        setShowNewsletter(c.footer?.showNewsletter !== false);
      })
      .catch((e) => setErr(String(e.message ?? e)))
      .finally(() => setLoading(false));
    apiAuth<Array<{ slug: string; title: string; status?: string }>>('/admin/catalog/collections')
      .then((rows) =>
        setCollections(
          rows.filter((r) => r.status !== 'DRAFT').map((r) => ({ slug: r.slug, title: r.title })),
        ),
      )
      .catch(() => {
        /* optional */
      });
  }, [router]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    setSaving(true);
    try {
      await apiAuth('/admin/commerce/gift-chrome', {
        method: 'POST',
        json: {
          navItems: compactNavItems(navItems),
          shopLabel: shopLabel.trim() || 'Shop',
          forWhomLabel: forWhomLabel.trim() || 'For Whom',
          journalLabel: journalLabel.trim() || 'Journal',
          journalHref: journalHref.trim() || '/articles',
          shopLinks: compactNavLinks(shopLinks),
          forWhomLinks: compactNavLinks(whomLinks),
          shopMega,
          forWhomMega: whomMega,
          footer: {
            brandName,
            brandHref: brandHref.trim() || '/gift',
            tagline,
            copyright: composeCopyrightTpl(copyrightParts),
            showNewsletter,
            newsletterTitle: newsletterTitle.trim(),
            newsletterHint: newsletterHint.trim(),
            reachTitle: reachTitle.trim() || 'Reach us',
            socialLinks: compactChromeLinks(socialLinks, true),
            reachLinks: compactChromeLinks(reachLinks, true),
            legalLinks: compactChromeLinks(legalLinks),
            columns: compactFooterColumns(footerColumns),
          },
        },
      });
      setMsg('Saved');
    } catch (ex) {
      setErr(String((ex as Error).message ?? ex));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm opacity-70">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Loading…
      </div>
    );
  }

  return (
    <div className="pb-20 sm:pb-4">
      <OpsPageHeader
        title="Nav & footer"
        actions={
          <>
            <Link
              href="/gift"
              target="_blank"
              rel="noreferrer"
              className="clay-btn-ghost hidden min-h-10 items-center gap-1.5 text-sm sm:inline-flex"
            >
              View storefront
              <ExternalLink className="h-3.5 w-3.5 opacity-70" aria-hidden />
            </Link>
            <button
              type="submit"
              form="gift-chrome-form"
              className="clay-btn shrink-0 text-sm disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      />

      {err ? (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {err}
        </p>
      ) : null}
      {msg ? (
        <p
          className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
          role="status"
        >
          {msg}
        </p>
      ) : null}

      <div
        className="mb-4 grid max-w-md grid-cols-2 gap-0.5 rounded-xl bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] p-0.5"
        role="tablist"
        aria-label="Chrome sections"
      >
        {(
          [
            { id: 'navbar' as const, label: 'Navbar' },
            { id: 'footer' as const, label: 'Footer' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              tab === t.id
                ? 'bg-[var(--background)] text-[var(--foreground)] shadow-sm'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form id="gift-chrome-form" onSubmit={(e) => void onSave(e)} className="space-y-4 text-sm">
        {tab === 'navbar' ? (
          <>
            <SectionCard title="Navigation" defaultOpen>
              <div className="space-y-3">
                {navItems.map((item, index) => {
                  const typeLabel = item.type === 'mega' ? 'Dropdown' : 'Link';
                  const linkCount = item.type === 'mega' ? (item.links?.length ?? 0) : null;
                  const summaryLabel =
                    item.label.trim() || (item.type === 'mega' ? 'New dropdown' : 'New link');
                  const groupOptions =
                    item.id === 'for-whom'
                      ? ['For baby', 'By age', 'More']
                      : item.id === 'shop'
                        ? ['Shop', 'Occasion', 'Curated', 'More']
                        : (() => {
                            const fromLinks = [
                              ...new Set(
                                (item.links ?? [])
                                  .map((l) => l.group?.trim())
                                  .filter((g): g is string => Boolean(g)),
                              ),
                            ];
                            if (!fromLinks.length) return ['More'];
                            return fromLinks.includes('More') ? fromLinks : [...fromLinks, 'More'];
                          })();
                  return (
                    <details
                      key={item.id}
                      className="rounded-xl border border-[var(--border-subtle)] bg-[var(--background)]"
                      open={index === 0}
                    >
                      <summary className="cursor-pointer px-3 py-3 text-sm font-medium">
                        <span>{summaryLabel}</span>
                        <span className="ml-2 font-normal text-[var(--muted-foreground)]">
                          · {typeLabel}
                          {linkCount !== null ? ` · ${linkCount}` : null}
                        </span>
                      </summary>
                      <div className="border-t border-[var(--border-subtle)] p-3">
                        <div className="grid gap-3 sm:grid-cols-[1fr_10rem_auto]">
                          <Field label="Label">
                            <input
                              className={INPUT}
                              value={item.label}
                              onChange={(e) =>
                                setNavItems((items) =>
                                  items.map((x, i) =>
                                    i === index ? { ...x, label: e.target.value } : x,
                                  ),
                                )
                              }
                            />
                          </Field>
                          <Field label="Type">
                            <select
                              className={INPUT}
                              value={item.type}
                              onChange={(e) =>
                                setNavItems((items) =>
                                  items.map((x, i) =>
                                    i === index
                                      ? {
                                          ...x,
                                          type: e.target.value as TopNavItem['type'],
                                          href:
                                            e.target.value === 'link' ? (x.href ?? '') : undefined,
                                          links:
                                            e.target.value === 'mega' ? (x.links ?? []) : undefined,
                                        }
                                      : x,
                                  ),
                                )
                              }
                            >
                              <option value="link">Single link</option>
                              <option value="mega">Dropdown</option>
                            </select>
                          </Field>
                          <button
                            type="button"
                            className="mt-5 inline-flex h-9 w-9 items-center justify-center rounded-full text-red-700 hover:bg-red-50"
                            aria-label={`Remove ${item.label || 'item'}`}
                            onClick={() =>
                              setNavItems((items) => items.filter((_, i) => i !== index))
                            }
                          >
                            <Trash2 className="h-4 w-4" aria-hidden />
                          </button>
                        </div>
                        {item.type === 'link' ? (
                          <Field label="Link" className="mt-3">
                            <input
                              className={`${INPUT} font-mono text-xs`}
                              value={item.href ?? ''}
                              onChange={(e) =>
                                setNavItems((items) =>
                                  items.map((x, i) =>
                                    i === index ? { ...x, href: e.target.value } : x,
                                  ),
                                )
                              }
                            />
                          </Field>
                        ) : (
                          <>
                            <div className="mt-3">
                              <GiftNavLinksEditor
                                links={item.links ?? []}
                                onChange={(links) =>
                                  setNavItems((items) =>
                                    items.map((x, i) => (i === index ? { ...x, links } : x)),
                                  )
                                }
                                groupOptions={groupOptions}
                                collections={collections}
                              />
                            </div>
                            <div className="mt-3">
                              <MegaFields
                                value={item.mega ?? DEFAULT_SHOP_MEGA}
                                onChange={(mega) =>
                                  setNavItems((items) =>
                                    items.map((x, i) => (i === index ? { ...x, mega } : x)),
                                  )
                                }
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </details>
                  );
                })}
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    className="clay-btn-secondary inline-flex min-h-9 items-center gap-1.5 text-sm"
                    onClick={() =>
                      setNavItems((items) => [
                        ...items,
                        { id: `link-${Date.now()}`, label: '', type: 'link', href: '' },
                      ])
                    }
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden />
                    Link
                  </button>
                  <button
                    type="button"
                    className="clay-btn-secondary inline-flex min-h-9 items-center gap-1.5 text-sm"
                    onClick={() =>
                      setNavItems((items) => [
                        ...items,
                        {
                          id: `menu-${Date.now()}`,
                          label: '',
                          type: 'mega',
                          links: [],
                          mega: DEFAULT_SHOP_MEGA,
                        },
                      ])
                    }
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden />
                    Dropdown
                  </button>
                </div>
              </div>
            </SectionCard>
          </>
        ) : (
          <>
            <SectionCard title="Brand" defaultOpen>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Name">
                  <input
                    className={INPUT}
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                  />
                </Field>
                <Field label="Home link">
                  <input
                    className={`${INPUT} font-mono text-xs`}
                    value={brandHref}
                    onChange={(e) => setBrandHref(e.target.value)}
                  />
                </Field>
                <Field label="Tagline" className="sm:col-span-2">
                  <input
                    className={INPUT}
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                  />
                </Field>
                <div className="sm:col-span-2 space-y-2">
                  <span className="text-xs font-medium">Copyright</span>
                  <div className="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-end">
                    <label className="flex items-center gap-2 pb-2 sm:pb-2.5">
                      <input
                        type="checkbox"
                        checked={copyrightParts.yearAuto}
                        onChange={(e) =>
                          setCopyrightParts((p) => ({ ...p, yearAuto: e.target.checked }))
                        }
                      />
                      <span className="text-sm">Current year</span>
                    </label>
                    <Field label="Year">
                      <input
                        type="month"
                        className={INPUT}
                        disabled={copyrightParts.yearAuto}
                        value={`${
                          copyrightParts.yearAuto
                            ? new Date().getFullYear()
                            : copyrightParts.yearFixed
                        }-01`}
                        onChange={(e) => {
                          const y = Number(e.target.value.slice(0, 4));
                          if (!Number.isFinite(y) || y < 2000 || y > 2100) return;
                          setCopyrightParts((p) => ({
                            ...p,
                            yearAuto: false,
                            yearFixed: y,
                          }));
                        }}
                        aria-label="Copyright year"
                      />
                    </Field>
                  </div>
                  <Field label="Line">
                    <input
                      className={INPUT}
                      value={copyrightParts.suffix}
                      onChange={(e) => setCopyrightParts((p) => ({ ...p, suffix: e.target.value }))}
                      placeholder="Soft gifts for tiny humans."
                    />
                  </Field>
                  <p className="text-xs text-[var(--muted-foreground)]" aria-live="polite">
                    {formatFooterCopyright(
                      composeCopyrightTpl(copyrightParts),
                      copyrightParts.yearAuto ? new Date().getFullYear() : copyrightParts.yearFixed,
                      brandName.trim() || 'Inabiya',
                    )}
                  </p>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Newsletter">
              <label className="mb-3 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showNewsletter}
                  onChange={(e) => setShowNewsletter(e.target.checked)}
                />
                <span className="text-sm font-medium">Show signup</span>
              </label>
              {showNewsletter ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Title">
                    <input
                      className={INPUT}
                      value={newsletterTitle}
                      onChange={(e) => setNewsletterTitle(e.target.value)}
                    />
                  </Field>
                  <Field label="Hint">
                    <input
                      className={INPUT}
                      value={newsletterHint}
                      onChange={(e) => setNewsletterHint(e.target.value)}
                    />
                  </Field>
                </div>
              ) : null}
            </SectionCard>

            <SectionCard title={`Link columns · ${footerColumns.length}`}>
              <GiftFooterColumnsEditor columns={footerColumns} onChange={setFooterColumns} />
            </SectionCard>

            <SectionCard title={`Reach us · ${reachLinks.length}`}>
              <Field label="Title" className="mb-3 max-w-xs">
                <input
                  className={INPUT}
                  value={reachTitle}
                  onChange={(e) => setReachTitle(e.target.value)}
                />
              </Field>
              <GiftFooterLinkListEditor links={reachLinks} onChange={setReachLinks} showNetwork />
            </SectionCard>

            <SectionCard title={`Social · ${socialLinks.length}`}>
              <GiftFooterLinkListEditor links={socialLinks} onChange={setSocialLinks} showNetwork />
            </SectionCard>

            <SectionCard title={`Legal · ${legalLinks.length}`}>
              <GiftFooterLinkListEditor links={legalLinks} onChange={setLegalLinks} />
            </SectionCard>
          </>
        )}
      </form>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--border-subtle)] bg-[var(--surface)]/95 p-3 backdrop-blur sm:hidden">
        <button
          type="submit"
          form="gift-chrome-form"
          className="clay-btn w-full text-sm disabled:opacity-50"
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}
