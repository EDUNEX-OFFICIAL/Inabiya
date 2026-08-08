'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/** Search stub retired — Support desk is the Soft Gift global lookup. */
function SearchRedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const q = searchParams.get('q')?.trim();
    const target = q
      ? `/admin/commerce/support?q=${encodeURIComponent(q)}`
      : '/admin/commerce/support';
    router.replace(target);
  }, [router, searchParams]);

  return (
    <div className="clay-panel px-4 py-8 text-center text-sm opacity-70" aria-busy="true">
      Opening Support…
    </div>
  );
}

export default function AdminSearchPage() {
  return (
    <Suspense
      fallback={
        <div className="clay-panel px-4 py-8 text-center text-sm opacity-70" aria-busy="true">
          Opening Support…
        </div>
      }
    >
      <SearchRedirectInner />
    </Suspense>
  );
}
