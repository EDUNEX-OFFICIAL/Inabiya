/** Soft Gift loading placeholders — prefer layout-shaped pulse over bare “Loading…”. */

function Pulse({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-foreground/[0.08] ${className ?? ''}`} />;
}

/** Product detail page — gallery + buy box silhouette. */
export function PdpSkeleton() {
  return (
    <main className="gift-page flex flex-col gap-gs-6 sm:gap-gs-7" aria-busy="true" aria-label="Loading product">
      <Pulse className="h-3 w-48 max-w-full rounded" />
      <div className="grid gap-gs-6 lg:grid-cols-2 lg:gap-gs-8">
        <div className="space-y-gs-3">
          <Pulse className="aspect-square w-full rounded-clay bg-foreground/[0.06]" />
          <div className="flex gap-gs-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Pulse key={i} className="size-16 shrink-0 rounded-control sm:size-20" />
            ))}
          </div>
        </div>
        <div className="min-w-0 space-y-gs-3">
          <Pulse className="h-5 w-24 rounded-pill" />
          <Pulse className="h-10 w-[80%] max-w-md rounded" />
          <Pulse className="h-4 w-32 rounded" />
          <Pulse className="mt-gs-2 h-8 w-28 rounded" />
          <Pulse className="h-20 w-full rounded-clay" />
          <Pulse className="h-12 w-full rounded-pill" />
          <Pulse className="h-12 w-full rounded-pill bg-foreground/[0.05]" />
        </div>
      </div>
      <div className="grid gap-gs-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Pulse key={i} className="h-16 rounded-clay" />
        ))}
      </div>
      <div className="space-y-gs-3">
        <Pulse className="h-8 w-56 max-w-full rounded" />
        <Pulse className="h-4 w-full max-w-2xl rounded" />
        <Pulse className="h-4 w-[85%] max-w-xl rounded" />
        <Pulse className="h-16 w-full rounded-clay" />
        <Pulse className="h-16 w-full rounded-clay" />
      </div>
    </main>
  );
}

/** Checkout — two-column form + summary silhouette. */
export function CheckoutSkeleton() {
  return (
    <main className="gift-page" aria-busy="true" aria-label="Loading checkout">
      <Pulse className="h-3 w-40 max-w-full rounded" />
      <Pulse className="mt-gs-4 h-9 w-48 max-w-full rounded" />
      <div className="mt-gs-6 grid gap-gs-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="space-y-gs-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-gs-3 rounded-clay border border-foreground/6 p-gs-4">
              <Pulse className="h-5 w-32 rounded" />
              <Pulse className="h-11 w-full rounded-control" />
              <Pulse className="h-11 w-full rounded-control" />
            </div>
          ))}
        </div>
        <div className="hidden space-y-gs-3 rounded-clay border border-foreground/6 p-gs-4 lg:block">
          <Pulse className="h-5 w-36 rounded" />
          <Pulse className="h-16 w-full rounded-control" />
          <Pulse className="h-16 w-full rounded-control" />
          <Pulse className="h-8 w-full rounded" />
        </div>
      </div>
    </main>
  );
}

/** Compact list pages (cart, wishlist, gift box). */
export function GiftListSkeleton({ label = 'Loading' }: { label?: string }) {
  return (
    <main className="gift-page space-y-gs-4" aria-busy="true" aria-label={label}>
      <Pulse className="h-8 w-48 max-w-full rounded" />
      <Pulse className="h-4 w-72 max-w-full rounded" />
      <ul className="space-y-gs-3 pt-gs-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <li key={i} className="flex gap-gs-3 rounded-clay border border-foreground/6 p-gs-3">
            <Pulse className="size-20 shrink-0 rounded-control sm:size-24" />
            <div className="min-w-0 flex-1 space-y-2 py-1">
              <Pulse className="h-4 w-3/4 rounded" />
              <Pulse className="h-4 w-1/3 rounded" />
              <Pulse className="h-8 w-24 rounded" />
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
