import Image from 'next/image';

export function LineThumb({
  imageUrl,
  quantity,
}: {
  imageUrl?: string | null;
  quantity: number;
}) {
  return (
    <span className="relative size-14 shrink-0">
      <span className="absolute inset-0 overflow-hidden rounded-control border border-border-subtle bg-surface">
        {imageUrl ? (
          <Image src={imageUrl} alt="" fill sizes="56px" className="object-cover" />
        ) : (
          <span className="gift-media-fallback absolute inset-0" />
        )}
      </span>
      <span className="absolute -right-1 -top-1 z-[1] flex h-5 min-w-5 items-center justify-center rounded-pill bg-foreground px-1 text-caption font-semibold text-background">
        {quantity}
      </span>
    </span>
  );
}
