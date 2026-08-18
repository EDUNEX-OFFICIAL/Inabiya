'use client';

import { GiftImage } from '@/components/gift/gift-image';
import { useEffect, useState } from 'react';
import {
  parseAmbientVideoUrl,
  youtubeNocookieAmbientUrl,
  youtubePosterUrl,
} from '@/lib/product-video';

type Props = {
  src?: string;
  alt: string;
  fallback?: string;
  priority?: boolean;
  sizes?: string;
  onReady?: () => void;
  className?: string;
};

export function HeroMedia({
  src,
  alt,
  fallback,
  priority,
  sizes = '100vw',
  onReady,
  className,
}: Props) {
  const url = (src?.trim() || fallback || '').trim();
  const video = parseAmbientVideoUrl(url);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (!url) onReady?.();
  }, [url, onReady]);

  if (!url) return null;

  const cover = `h-full w-full object-cover ${className ?? ''}`.trim();

  if (video?.kind === 'youtube') {
    if (reduceMotion) {
      return (
        <GiftImage
          src={youtubePosterUrl(video.id)}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          className={cover}
          onLoad={onReady}
        />
      );
    }
    return (
      <div className="absolute inset-0 overflow-hidden">
        <iframe
          title={alt || 'Hero video'}
          src={youtubeNocookieAmbientUrl(video.id)}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2 border-0"
          onLoad={onReady}
        />
      </div>
    );
  }

  if (video?.kind === 'direct') {
    return (
      <video
        src={video.url}
        className={`absolute inset-0 ${cover}`}
        autoPlay={!reduceMotion}
        muted
        loop={!reduceMotion}
        playsInline
        preload="metadata"
        onLoadedData={onReady}
      />
    );
  }

  return (
    <GiftImage
      src={url}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      className={cover}
      onLoad={onReady}
      onLoadingComplete={onReady}
    />
  );
}
