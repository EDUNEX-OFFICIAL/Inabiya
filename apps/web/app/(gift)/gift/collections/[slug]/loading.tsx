export default function CollectionLoading() {
  return (
    <main className="gift-page !max-w-none !px-0" aria-busy="true" aria-label="Loading collection">
      <div className="border-b border-foreground/6 bg-foreground/[0.03]">
        <div className="mx-auto w-full px-gs-4 py-gs-6 sm:px-gs-6 lg:px-gs-8">
          <div className="h-3 w-48 animate-pulse rounded bg-foreground/10" />
          <div className="mt-gs-4 h-9 w-72 max-w-full animate-pulse rounded bg-foreground/10" />
          <div className="mt-gs-3 h-4 w-96 max-w-full animate-pulse rounded bg-foreground/8" />
        </div>
      </div>
      <div className="mx-auto flex w-full gap-gs-7 px-gs-4 py-gs-6 sm:px-gs-6 lg:px-gs-8">
        <div className="hidden w-56 shrink-0 space-y-gs-4 md:block">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-control bg-foreground/[0.06]" />
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-gs-4 h-8 w-full max-w-sm animate-pulse rounded bg-foreground/8" />
          <ul className="grid grid-cols-1 gap-gs-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="overflow-hidden rounded-clay bg-foreground/[0.04]">
                <div className="h-44 animate-pulse bg-foreground/[0.08]" />
                <div className="space-y-2 p-gs-4">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-foreground/10" />
                  <div className="h-4 w-1/3 animate-pulse rounded bg-foreground/8" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
