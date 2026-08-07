'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Play } from 'lucide-react';
import {
  parseProductVideoUrl,
  youtubeNocookieEmbedUrl,
  youtubePosterUrl,
} from '@/lib/product-video';

type Props = {
  url: string;
  title: string;
  posterUrl?: string | null;
  /** Fallback when no poster and not YouTube (e.g. first gallery image). */
  fallbackPosterUrl?: string | null;
};

/**
 * Below-fold PDP video: poster facade until click — no iframe / video src on load.
 */
export function ProductVideoPlayer({
  url,
  title,
  posterUrl,
  fallbackPosterUrl,
}: Props) {
  const [playing, setPlaying] = useState(false);
  const source = parseProductVideoUrl(url);
  if (!source) return null;

  const poster =
    (posterUrl?.trim() || null) ||
    (source.kind === 'youtube' ? youtubePosterUrl(source.id) : null) ||
    (fallbackPosterUrl?.trim() || null);

  if (playing) {
    if (source.kind === 'youtube') {
      return (
        <div className="relative aspect-video w-full overflow-hidden rounded-clay bg-foreground/10">
          <iframe
            title={title}
            src={youtubeNocookieEmbedUrl(source.id, true)}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
            loading="lazy"
          />
        </div>
      );
    }
    return (
      <video
        key={source.url}
        src={source.url}
        poster={poster ?? undefined}
        controls
        autoPlay
        playsInline
        className="aspect-video w-full rounded-clay bg-foreground/5 object-contain"
      >
        <track kind="captions" />
      </video>
    );
  }

  return (
    <button
      type="button"
      className="group relative block w-full overflow-hidden rounded-clay"
      onClick={() => setPlaying(true)}
      aria-label={`Play video: ${title}`}
    >
      <div className="relative aspect-video w-full bg-foreground/10">
        {poster ? (
          <Image
            src={poster}
            alt=""
            fill
            sizes="100vw"
            loading="lazy"
            className="object-cover transition group-hover:scale-[1.01]"
          />
        ) : (
          <div className="gift-media-fallback absolute inset-0" aria-hidden />
        )}
      </div>
      <span className="absolute inset-0 flex flex-col items-center justify-center bg-foreground/35 px-gs-4 text-center text-white">
        <span className="flex size-14 items-center justify-center rounded-pill bg-white/95 text-primary shadow-clay">
          <Play className="size-7 fill-current pl-0.5" aria-hidden />
        </span>
        <span className="mt-gs-3 gift-h2">See the unboxing</span>
      </span>
    </button>
  );
}
