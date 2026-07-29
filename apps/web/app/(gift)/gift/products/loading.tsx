export default function ProductsLoading() {
  return (
    <main className="gift-page" aria-busy="true" aria-label="Loading products">
      <div className="h-8 w-56 max-w-full animate-pulse rounded bg-foreground/10" />
      <div className="mt-gs-3 h-4 w-80 max-w-full animate-pulse rounded bg-foreground/8" />
      <ul className="mt-gs-6 grid grid-cols-1 gap-gs-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="overflow-hidden rounded-2xl bg-foreground/[0.04]">
            <div className="aspect-[4/5] animate-pulse bg-foreground/[0.08]" />
            <div className="space-y-2 p-gs-4">
              <div className="h-4 w-3/4 animate-pulse rounded bg-foreground/10" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-foreground/8" />
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
