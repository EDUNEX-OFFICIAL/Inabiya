'use client';

import { useEffect, useMemo, useState } from 'react';
import { Play } from 'lucide-react';

type Media = {
  url: string;
  altText: string | null;
  kind?: 'IMAGE' | 'VIDEO';
  posterUrl?: string | null;
};

export function PdpGallery({ media, title }: { media: Media[]; title: string }) {
  const [active, setActive] = useState(0);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const mediaKey = useMemo(() => media.map((m) => m.url).join('\0'), [media]);

  useEffect(() => {
    setActive(0);
    setVideoPlaying(false);
  }, [mediaKey]);

  const safeIndex = media.length === 0 ? 0 : Math.min(active, media.length - 1);
  const current = media[safeIndex];
  const multi = media.length > 1;
  const isVideo = current?.kind === 'VIDEO';

  return (
    <div className="space-y-gs-3">
      <div className="relative">
        <div className="clay-card overflow-hidden">
          {current?.url ? (
            isVideo ? (
              videoPlaying ? (
                <video
                  key={current.url}
                  src={current.url}
                  poster={current.posterUrl ?? undefined}
                  controls
                  autoPlay
                  playsInline
                  className="aspect-square w-full bg-foreground/5 object-contain"
                >
                  <track kind="captions" />
                </video>
              ) : (
                <button
                  type="button"
                  className="group relative block aspect-square w-full"
                  onClick={() => setVideoPlaying(true)}
                  aria-label={`Play video for ${title}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={current.posterUrl || current.url}
                    alt={current.altText ?? title}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-foreground/25 transition group-hover:bg-foreground/35">
                    <span className="flex size-16 items-center justify-center rounded-full bg-white/95 text-primary shadow-clay">
                      <Play className="size-7 fill-current pl-0.5" aria-hidden />
                    </span>
                  </span>
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/50 to-transparent px-gs-4 py-gs-4 text-left text-sm font-medium text-white">
                    See the unboxing
                  </span>
                </button>
              )
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={current.url}
                alt={current.altText ?? title}
                className="aspect-square w-full object-cover"
              />
            )
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
          aria-label="Product media"
        >
          {media.map((m, i) => (
            <li key={`${m.url}-${i}`} className="shrink-0">
              <button
                type="button"
                onClick={() => {
                  setActive(i);
                  setVideoPlaying(false);
                }}
                aria-label={
                  m.kind === 'VIDEO'
                    ? `View video ${i + 1} of ${media.length}`
                    : `View image ${i + 1} of ${media.length}`
                }
                aria-pressed={i === safeIndex}
                className={`relative overflow-hidden rounded-control border-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  i === safeIndex
                    ? 'border-primary shadow-clay'
                    : 'border-transparent opacity-80 hover:opacity-100'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.kind === 'VIDEO' ? m.posterUrl || m.url : m.url}
                  alt=""
                  className="h-14 w-14 object-cover sm:h-20 sm:w-20"
                />
                {m.kind === 'VIDEO' ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-foreground/30">
                    <Play className="size-4 fill-white text-white" aria-hidden />
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
