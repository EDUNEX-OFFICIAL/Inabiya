import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { MarketingPageBlocks } from '@/components/cms/marketing-page-blocks';
import { apiUrl } from '@/lib/api-base';
import { CSRF_HEADER, CSRF_HEADER_VALUE } from '@/lib/auth-client';
import { portalLoginUrl } from '@/lib/auth-portals';
import { safeNextPath } from '@inabiya/validation';

export const dynamic = 'force-dynamic';

type MarketingPage = {
  id: string;
  slug: string;
  title: string;
  status: string;
  blocks: Array<{
    id: string;
    type: string;
    sortOrder: number;
    props: Record<string, unknown>;
  }>;
};

async function fetchPreview(id: string): Promise<{ page: MarketingPage } | { status: number }> {
  const cookieHeader = cookies()
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  try {
    const res = await fetch(apiUrl(`/admin/cms/pages/${encodeURIComponent(id)}/preview`), {
      cache: 'no-store',
      headers: {
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        [CSRF_HEADER]: CSRF_HEADER_VALUE,
      },
    });
    if (!res.ok) return { status: res.status };
    return { page: (await res.json()) as MarketingPage };
  } catch {
    return { status: 500 };
  }
}

export default async function MarketingPagePreview({ params }: { params: { id: string } }) {
  const next = safeNextPath(`/pages/preview/${params.id}`) ?? '/admin/cms/pages';
  const result = await fetchPreview(params.id);

  if ('status' in result) {
    if (result.status === 401 || result.status === 403) {
      redirect(portalLoginUrl(next));
    }
    return (
      <main className="gift-page max-w-3xl">
        <p className="text-body text-danger">
          {result.status === 404 ? 'Page not found' : 'Preview failed'}
        </p>
        <Link href="/admin/cms/pages" className="mt-gs-4 inline-block text-body underline">
          ← Pages
        </Link>
      </main>
    );
  }

  const { page } = result;

  return (
    <main className={page.slug === 'home' ? '' : 'gift-page max-w-3xl'}>
      <div className="mb-gs-4 flex flex-wrap items-center justify-between gap-gs-2 px-gs-4 pt-gs-4 text-body sm:px-gs-6">
        <Link href={`/admin/cms/pages/${page.id}`} className="underline opacity-70">
          ← Edit page
        </Link>
        <span className="opacity-70">
          {page.slug === 'home' ? '/' : `/pages/${page.slug}`} · {page.status}
        </span>
      </div>
      <MarketingPageBlocks
        blocks={page.blocks}
        layout={page.slug === 'home' ? 'home' : 'page'}
        previewBanner={`Draft preview · ${page.title} · not public until published`}
      />
    </main>
  );
}
