'use client';

import { useEffect, useMemo, useState } from 'react';

type Media = { url: string; altText: string | null };

export function PdpGallery({
  media,
  title,
}: {
  media: Media[];
  title: string;
}) {
  const [active, setActive] = useState(0);
  const mediaKey = useMemo(() => media.map((m) => m.url).join('\0'), [media]);

  useEffect(() => {
    setActive(0);
  }, [mediaKey]);

  const safeIndex = media.length === 0 ? 0 : Math.min(active, media.length - 1);
  const current = media[safeIndex];
  const multi = media.length > 1;

  return (
    <div className="space-y-gs-3">
      <div className="relative">
        <div className="clay-card overflow-hidden">
          {current?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={current.url}
              alt={current.altText ?? title}
              className="aspect-square w-full object-cover"
            />
          ) : (
            <div className="aspect-square w-full gift-media-fallback" aria-hidden />
          )}
        </div>
        {multi ? (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-gs-3 flex justify-center gap-1.5"
            aria-hidden
          >
            {media.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full ${
                  i === safeIndex ? 'bg-primary' : 'bg-white/80 shadow-sm'
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>
      {multi ? (
        <ul
          className="-mx-1 flex gap-gs-2 overflow-x-auto px-1 pb-gs-1 [scrollbar-width:thin]"
          aria-label="Product images"
        >
          {media.map((m, i) => (
            <li key={`${m.url}-${i}`} className="shrink-0">
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`View image ${i + 1} of ${media.length}`}
                aria-pressed={i === safeIndex}
                className={`overflow-hidden rounded-control border-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  i === safeIndex
                    ? 'border-primary shadow-clay'
                    : 'border-transparent opacity-80 hover:opacity-100'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.url}
                  alt=""
                  className="h-14 w-14 object-cover sm:h-20 sm:w-20"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
