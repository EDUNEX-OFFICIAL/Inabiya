'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink, LayoutGrid, RefreshCw, Search, X } from 'lucide-react';
import { apiAuth, getStoredAccessToken, loginUrl } from '@/lib/auth-client';
import { OpsPageHeader } from '@/components/commerce-ops/ops-page-header';

type CmsPageRow = {
  id: string;
  slug: string;
  title: string;
  isHomepage?: boolean;
};

type StorefrontConfig = {
  featuredSlugs: string[];
  heroTitle: string;
  heroSubtitle: string;
};

type ProductHit = { id: string; title: string; slug: string };

export default function MerchandisingPage() {
  const router = useRouter();
  const [slugList, setSlugList] = useState<string[]>([]);
  const [heroTitle, setHeroTitle] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [homePageId, setHomePageId] = useState<string | null>(null);
  const [productQ, setProductQ] = useState('');
  const [productHits, setProductHits] = useState<ProductHit[]>([]);
  const [productSearching, setProductSearching] = useState(false);
  const [manualSlug, setManualSlug] = useState('');

  const loadSeq = useRef(0);
  const hasLoadedOnce = useRef(false);
  const productSearchSeq = useRef(0);

  const load = useCallback(async () => {
    const seq = ++loadSeq.current;
    setError(null);
    if (!hasLoadedOnce.current) setLoading(true);
    else setRefreshing(true);
    try {
      const [cfg, pages] = await Promise.all([
        apiAuth<StorefrontConfig>('/admin/commerce/storefront'),
        apiAuth<CmsPageRow[]>('/admin/cms/pages').catch(() => [] as CmsPageRow[]),
      ]);
      if (seq !== loadSeq.current) return;
      setSlugList(cfg.featuredSlugs);
      setHeroTitle(cfg.heroTitle);
      const home = pages.find((p) => p.slug === 'home' || p.isHomepage);
      setHomePageId(home?.id ?? null);
      hasLoadedOnce.current = true;
    } catch (err) {
      if (seq !== loadSeq.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      if (seq === loadSeq.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace(loginUrl('/admin/commerce/merchandising'));
      return;
    }
    void load();
  }, [router, load]);

  useEffect(() => {
    const q = productQ.trim();
    if (q.length < 2) {
      setProductHits([]);
      return;
    }
    const t = window.setTimeout(() => {
      const seq = ++productSearchSeq.current;
      setProductSearching(true);
      void apiAuth<{ items: ProductHit[] }>(
        `/admin/catalog/products?q=${encodeURIComponent(q)}&limit=8&status=PUBLISHED`,
      )
        .then((res) => {
          if (seq !== productSearchSeq.current) return;
          setProductHits(res.items ?? []);
        })
        .catch(() => {
          if (seq !== productSearchSeq.current) return;
          setProductHits([]);
        })
        .finally(() => {
          if (seq === productSearchSeq.current) setProductSearching(false);
        });
    }, 280);
    return () => window.clearTimeout(t);
  }, [productQ]);

  function addSlug(slug: string) {
    const s = slug.trim().toLowerCase();
    if (!s) return;
    setSlugList((prev) => (prev.includes(s) ? prev : [...prev, s]));
    setProductQ('');
    setProductHits([]);
    setManualSlug('');
  }

  function removeSlug(slug: string) {
    setSlugList((prev) => prev.filter((s) => s !== slug));
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await apiAuth('/admin/commerce/storefront', {
        method: 'POST',
        json: {
          featuredSlugs: slugList,
          heroTitle: heroTitle.trim(),
        },
      });
      setMessage('Featured pins saved');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <OpsPageHeader
        title="Merchandising"
        actions={
          <>
            <Link
              href="/gift"
              className="clay-btn-ghost inline-flex min-h-10 items-center gap-1.5 text-sm"
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink className="h-3.5 w-3.5 opacity-70" aria-hidden />
              Preview
            </Link>
            <Link href="/admin/commerce/products" className="clay-btn-ghost min-h-10 text-sm">
              Catalog
            </Link>
            <button
              type="button"
              className="clay-btn-secondary inline-flex min-h-10 items-center gap-1.5 text-sm"
              disabled={loading || refreshing}
              onClick={() => void load()}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 opacity-70 ${loading || refreshing ? 'animate-spin' : ''}`}
                aria-hidden
              />
              Refresh
            </button>
          </>
        }
      />

      {message ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="clay-panel space-y-3 p-4" aria-busy="true">
          <div className="h-16 animate-pulse rounded-lg bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
          <div className="h-32 animate-pulse rounded-lg bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
        </div>
      ) : (
        <div className={refreshing ? 'space-y-4 opacity-70 transition-opacity' : 'space-y-4'}>
          <section className="clay-panel p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg leading-tight">Homepage</h2>
                <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                  Soft Gift /gift layout
                </p>
              </div>
              {homePageId ? (
                <Link
                  href={`/admin/cms/pages/${homePageId}`}
                  className="clay-btn inline-flex min-h-10 items-center gap-1.5 text-sm"
                >
                  <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
                  Edit blocks
                </Link>
              ) : (
                <Link href="/admin/cms/pages" className="clay-btn-secondary min-h-10 text-sm">
                  Marketing pages
                </Link>
              )}
            </div>
          </section>

          <form onSubmit={(e) => void onSave(e)} className="clay-panel space-y-4 p-4">
            <div>
              <h2 className="font-display text-lg leading-tight">Featured pins</h2>
              <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">Legacy carousel slugs</p>
            </div>

            <label className="block text-xs">
              Hero title
              <input
                className="clay-input mt-1 block w-full min-h-10 text-sm"
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
              />
            </label>

            <div className="space-y-2">
              <p className="text-xs font-medium opacity-70">Products</p>
              <div className="relative">
                <div className="flex min-h-10 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[color-mix(in_srgb,var(--surface)_92%,white)] px-3">
                  <Search className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
                  <input
                    className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:opacity-50"
                    value={productQ}
                    onChange={(e) => setProductQ(e.target.value)}
                    placeholder="Search published products"
                    aria-label="Search products to pin"
                  />
                  {productSearching ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin opacity-50" aria-hidden />
                  ) : null}
                </div>
                {productHits.length > 0 ? (
                  <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] py-1 shadow-md">
                    {productHits.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          className="block w-full px-3 py-2 text-left text-sm hover:bg-[color-mix(in_srgb,var(--primary)_8%,transparent)]"
                          onClick={() => addSlug(p.slug)}
                        >
                          <span className="font-medium">{p.title}</span>
                          <span className="ml-2 font-mono text-[11px] opacity-50">{p.slug}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                <input
                  className="clay-input min-h-10 min-w-[10rem] flex-1 font-mono text-sm"
                  value={manualSlug}
                  onChange={(e) => setManualSlug(e.target.value)}
                  placeholder="Or paste slug"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSlug(manualSlug);
                    }
                  }}
                />
                <button
                  type="button"
                  className="clay-btn-secondary min-h-10 px-3 text-sm"
                  onClick={() => addSlug(manualSlug)}
                >
                  Add
                </button>
              </div>

              {slugList.length ? (
                <ul className="flex flex-wrap gap-1.5">
                  {slugList.map((slug) => (
                    <li
                      key={slug}
                      className="inline-flex items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--primary)_12%,white)] px-2 py-0.5 font-mono text-xs text-[var(--primary)]"
                    >
                      {slug}
                      <button
                        type="button"
                        className="rounded-full p-0.5 hover:bg-[color-mix(in_srgb,var(--primary)_20%,transparent)]"
                        aria-label={`Remove ${slug}`}
                        onClick={() => removeSlug(slug)}
                      >
                        <X className="h-3 w-3" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="ops-muted text-xs">No featured pins.</p>
              )}
            </div>

            <button type="submit" className="clay-btn text-sm disabled:opacity-50" disabled={busy}>
              Save pins
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
