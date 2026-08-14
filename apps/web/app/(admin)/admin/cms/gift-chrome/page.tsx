'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';
import { GiftNavLinksEditor, compactNavLinks, type NavLinkRow } from './nav-links-editor';
import {
  GiftFooterColumnsEditor,
  GiftFooterLinkListEditor,
  compactChromeLinks,
  compactFooterColumns,
  type ChromeLinkRow,
  type FooterColRow,
} from './footer-editor';

type Mega = {
  headline: string;
  body: string;
  ctaHref: string;
  ctaLabel: string;
  imageSrc: string;
};
type Chrome = {
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
  { label: 'Shipping', href: '/gift#faq' },
  { label: 'Contact', href: '/contact' },
];

export default function GiftChromeAdminPage() {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [shopLabel, setShopLabel] = useState('Shop');
  const [forWhomLabel, setForWhomLabel] = useState('For Whom');
  const [journalLabel, setJournalLabel] = useState('Journal');
  const [journalHref, setJournalHref] = useState('/articles');
  const [shopLinks, setShopLinks] = useState<NavLinkRow[]>([]);
  const [whomLinks, setWhomLinks] = useState<NavLinkRow[]>([]);
  const [collections, setCollections] = useState<Array<{ slug: string; title: string }>>([]);
  const [shopMega, setShopMega] = useState<Mega>({
    headline: '',
    body: '',
    ctaHref: '',
    ctaLabel: '',
    imageSrc: '',
  });
  const [whomMega, setWhomMega] = useState<Mega>({
    headline: '',
    body: '',
    ctaHref: '',
    ctaLabel: '',
    imageSrc: '',
  });
  const [brandName, setBrandName] = useState('Inabiya');
  const [brandHref, setBrandHref] = useState('/gift');
  const [tagline, setTagline] = useState('');
  const [copyright, setCopyright] = useState('© {year} {brand}. Soft gifts for tiny humans.');
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
      router.replace('/login?next=/admin/cms/gift-chrome');
      return;
    }
    apiAuth<Chrome>('/admin/commerce/gift-chrome')
      .then((c) => {
        setShopLabel(c.shopLabel?.trim() || 'Shop');
        setForWhomLabel(c.forWhomLabel?.trim() || 'For Whom');
        setJournalLabel(c.journalLabel?.trim() || 'Journal');
        setJournalHref(c.journalHref?.trim() || '/articles');
        setShopLinks(c.shopLinks?.length ? c.shopLinks : DEFAULT_SHOP);
        setWhomLinks(c.forWhomLinks?.length ? c.forWhomLinks : DEFAULT_WHOM);
        setShopMega({
          headline: c.shopMega?.headline ?? '',
          body: c.shopMega?.body ?? '',
          ctaHref: c.shopMega?.ctaHref ?? '',
          ctaLabel: c.shopMega?.ctaLabel ?? '',
          imageSrc: c.shopMega?.imageSrc ?? '',
        });
        setWhomMega({
          headline: c.forWhomMega?.headline ?? '',
          body: c.forWhomMega?.body ?? '',
          ctaHref: c.forWhomMega?.ctaHref ?? '',
          ctaLabel: c.forWhomMega?.ctaLabel ?? '',
          imageSrc: c.forWhomMega?.imageSrc ?? '',
        });
        setBrandName(c.footer?.brandName ?? 'Inabiya');
        setBrandHref(c.footer?.brandHref?.trim() || '/gift');
        setTagline(c.footer?.tagline ?? '');
        setCopyright(
          c.footer?.copyright?.trim() || '© {year} {brand}. Soft gifts for tiny humans.',
        );
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
      .catch((e) => setErr(String(e.message ?? e)));
    apiAuth<Array<{ slug: string; title: string; status?: string }>>('/admin/catalog/collections')
      .then((rows) =>
        setCollections(
          rows.filter((r) => r.status !== 'DRAFT').map((r) => ({ slug: r.slug, title: r.title })),
        ),
      )
      .catch(() => {
        /* optional helper */
      });
  }, [router]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    try {
      await apiAuth('/admin/commerce/gift-chrome', {
        method: 'POST',
        json: {
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
            copyright: copyright.trim(),
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
      setMsg('Saved.');
    } catch (ex) {
      setErr(String((ex as Error).message ?? ex));
    }
  }

  return (
    <main className="min-h-screen p-8 max-w-3xl bg-[var(--background)] text-[var(--foreground)]">
      <p className="text-sm opacity-70">
        <Link className="underline" href="/admin/cms/pages">
          Marketing pages
        </Link>{' '}
        / Gift chrome
      </p>
      <h1 className="font-display text-3xl mt-2">Soft Gift nav & footer</h1>
      {err ? <p className="mt-4 text-sm text-red-600">{err}</p> : null}
      {msg ? <p className="mt-4 text-sm text-green-700">{msg}</p> : null}

      <form onSubmit={(e) => void onSave(e)} className="mt-8 space-y-8 text-sm">
        <section className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            Shop
            <input
              className="mt-1 w-full border rounded px-2 py-1"
              value={shopLabel}
              onChange={(e) => setShopLabel(e.target.value)}
            />
          </label>
          <label className="block">
            For Whom
            <input
              className="mt-1 w-full border rounded px-2 py-1"
              value={forWhomLabel}
              onChange={(e) => setForWhomLabel(e.target.value)}
            />
          </label>
          <label className="block">
            Journal
            <input
              className="mt-1 w-full border rounded px-2 py-1"
              value={journalLabel}
              onChange={(e) => setJournalLabel(e.target.value)}
            />
          </label>
          <label className="block">
            Journal URL
            <input
              className="mt-1 w-full border rounded px-2 py-1 font-mono text-xs"
              value={journalHref}
              onChange={(e) => setJournalHref(e.target.value)}
            />
          </label>
        </section>

        <GiftNavLinksEditor
          heading="Shop links"
          links={shopLinks}
          onChange={setShopLinks}
          groupOptions={['Shop', 'Occasion', 'Curated', 'More']}
          collections={collections}
        />
        <p>
          <button
            type="button"
            className="rounded border px-3 py-1.5"
            onClick={() => setShopLinks(DEFAULT_SHOP)}
          >
            Shop defaults
          </button>
        </p>

        <section className="space-y-2">
          <h2 className="font-medium">Shop mega panel</h2>
          {(['headline', 'body', 'ctaLabel', 'ctaHref', 'imageSrc'] as const).map((k) => (
            <label key={k} className="block">
              {k}
              <input
                className="mt-1 w-full border rounded px-2 py-1"
                value={shopMega[k]}
                onChange={(e) => setShopMega({ ...shopMega, [k]: e.target.value })}
              />
            </label>
          ))}
        </section>

        <GiftNavLinksEditor
          heading="For Whom links"
          links={whomLinks}
          onChange={setWhomLinks}
          groupOptions={['For baby', 'By age']}
          collections={collections}
        />
        <p>
          <button
            type="button"
            className="rounded border px-3 py-1.5"
            onClick={() => setWhomLinks(DEFAULT_WHOM)}
          >
            For Whom defaults
          </button>
        </p>

        <section className="space-y-2">
          <h2 className="font-medium">For Whom mega panel</h2>
          {(['headline', 'body', 'ctaLabel', 'ctaHref', 'imageSrc'] as const).map((k) => (
            <label key={k} className="block">
              {k}
              <input
                className="mt-1 w-full border rounded px-2 py-1"
                value={whomMega[k]}
                onChange={(e) => setWhomMega({ ...whomMega, [k]: e.target.value })}
              />
            </label>
          ))}
        </section>

        <section className="space-y-3">
          <h2 className="font-medium">Footer</h2>
          <label className="block">
            Brand name
            <input
              className="mt-1 w-full border rounded px-2 py-1"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
            />
          </label>
          <label className="block">
            Brand URL
            <input
              className="mt-1 w-full border rounded px-2 py-1 font-mono text-xs"
              value={brandHref}
              onChange={(e) => setBrandHref(e.target.value)}
            />
          </label>
          <label className="block">
            Tagline
            <input
              className="mt-1 w-full border rounded px-2 py-1"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
            />
          </label>
          <label className="block">
            Copyright
            <input
              className="mt-1 w-full border rounded px-2 py-1"
              value={copyright}
              onChange={(e) => setCopyright(e.target.value)}
              placeholder="© {year} {brand}."
            />
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showNewsletter}
              onChange={(e) => setShowNewsletter(e.target.checked)}
            />
            Newsletter
          </label>
          {showNewsletter ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="block">
                Newsletter title
                <input
                  className="mt-1 w-full border rounded px-2 py-1"
                  value={newsletterTitle}
                  onChange={(e) => setNewsletterTitle(e.target.value)}
                />
              </label>
              <label className="block">
                Newsletter hint
                <input
                  className="mt-1 w-full border rounded px-2 py-1"
                  value={newsletterHint}
                  onChange={(e) => setNewsletterHint(e.target.value)}
                />
              </label>
            </div>
          ) : null}
        </section>

        <GiftFooterColumnsEditor columns={footerColumns} onChange={setFooterColumns} />
        <GiftFooterLinkListEditor
          heading="Social"
          links={socialLinks}
          onChange={setSocialLinks}
          showNetwork
        />
        <section className="space-y-2">
          <label className="block">
            Reach title
            <input
              className="mt-1 w-full border rounded px-2 py-1"
              value={reachTitle}
              onChange={(e) => setReachTitle(e.target.value)}
            />
          </label>
        </section>
        <GiftFooterLinkListEditor
          heading="Reach us"
          links={reachLinks}
          onChange={setReachLinks}
          showNetwork
        />
        <GiftFooterLinkListEditor heading="Legal" links={legalLinks} onChange={setLegalLinks} />

        <button type="submit" className="rounded border px-4 py-2 font-medium">
          Save chrome
        </button>
      </form>
    </main>
  );
}
