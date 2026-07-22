'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';

type LinkRow = { href: string; label: string };
type Mega = {
  headline: string;
  body: string;
  ctaHref: string;
  ctaLabel: string;
  imageSrc: string;
};
type FooterCol = { title: string; links: LinkRow[] };

type Chrome = {
  shopLinks: LinkRow[];
  forWhomLinks: LinkRow[];
  shopMega: Mega;
  forWhomMega: Mega;
  footer: {
    brandName: string;
    tagline: string;
    columns: FooterCol[];
  };
};

function linksToText(links: LinkRow[]) {
  return links.map((l) => `${l.label} | ${l.href}`).join('\n');
}

function textToLinks(text: string): LinkRow[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split('|').map((s) => s.trim());
      const label = parts[0] || '';
      const href = parts[1] || parts[0] || '';
      return { label: label || href, href: href || label };
    })
    .filter((l): l is LinkRow => Boolean(l.href && l.label));
}

export default function GiftChromeAdminPage() {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [shopText, setShopText] = useState('');
  const [whomText, setWhomText] = useState('');
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
  const [tagline, setTagline] = useState('');
  const [footerShop, setFooterShop] = useState('');
  const [footerCompany, setFooterCompany] = useState('');

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace('/login?next=/admin/cms/gift-chrome');
      return;
    }
    apiAuth<Chrome>('/admin/commerce/gift-chrome')
      .then((c) => {
        setShopText(linksToText(c.shopLinks ?? []));
        setWhomText(linksToText(c.forWhomLinks ?? []));
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
        setTagline(c.footer?.tagline ?? '');
        const cols = c.footer?.columns ?? [];
        setFooterShop(
          linksToText(cols.find((x) => /shop/i.test(x.title))?.links ?? cols[0]?.links ?? []),
        );
        setFooterCompany(
          linksToText(cols.find((x) => /company/i.test(x.title))?.links ?? cols[1]?.links ?? []),
        );
      })
      .catch((e) => setErr(String(e.message ?? e)));
  }, [router]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    try {
      await apiAuth('/admin/commerce/gift-chrome', {
        method: 'POST',
        json: {
          shopLinks: textToLinks(shopText),
          forWhomLinks: textToLinks(whomText),
          shopMega,
          forWhomMega: whomMega,
          footer: {
            brandName,
            tagline,
            columns: [
              { title: 'Shop', links: textToLinks(footerShop) },
              { title: 'Company', links: textToLinks(footerCompany) },
            ],
          },
        },
      });
      setMsg('Saved — Soft Gift nav + footer updated.');
    } catch (ex) {
      setErr(String((ex as Error).message ?? ex));
    }
  }

  return (
    <main className="min-h-screen p-8 max-w-2xl bg-[var(--background)] text-[var(--foreground)]">
      <p className="text-sm opacity-70">
        <Link className="underline" href="/admin/cms/pages">
          Marketing pages
        </Link>{' '}
        / Gift chrome
      </p>
      <h1 className="font-display text-3xl mt-2">Soft Gift nav & footer</h1>
      <p className="mt-2 text-sm opacity-70">
        Controls mega-menu links and default footer when the homepage has no{' '}
        <code className="text-xs">footer</code> block. Format:{' '}
        <code className="text-xs">Label | /path</code> per line.
      </p>
      {err ? <p className="mt-4 text-sm text-red-600">{err}</p> : null}
      {msg ? <p className="mt-4 text-sm text-green-700">{msg}</p> : null}

      <form onSubmit={(e) => void onSave(e)} className="mt-8 space-y-6 text-sm">
        <section className="space-y-2">
          <h2 className="font-medium">Shop mega links</h2>
          <textarea
            className="w-full min-h-[8rem] border rounded p-2 font-mono text-xs"
            value={shopText}
            onChange={(e) => setShopText(e.target.value)}
          />
        </section>
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
        <section className="space-y-2">
          <h2 className="font-medium">For Whom mega links</h2>
          <textarea
            className="w-full min-h-[8rem] border rounded p-2 font-mono text-xs"
            value={whomText}
            onChange={(e) => setWhomText(e.target.value)}
          />
        </section>
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
        <section className="space-y-2">
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
            Tagline
            <input
              className="mt-1 w-full border rounded px-2 py-1"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
            />
          </label>
          <label className="block">
            Shop column links
            <textarea
              className="mt-1 w-full min-h-[6rem] border rounded p-2 font-mono text-xs"
              value={footerShop}
              onChange={(e) => setFooterShop(e.target.value)}
            />
          </label>
          <label className="block">
            Company column links
            <textarea
              className="mt-1 w-full min-h-[6rem] border rounded p-2 font-mono text-xs"
              value={footerCompany}
              onChange={(e) => setFooterCompany(e.target.value)}
            />
          </label>
        </section>
        <button type="submit" className="rounded border px-4 py-2 font-medium">
          Save chrome
        </button>
      </form>
    </main>
  );
}
