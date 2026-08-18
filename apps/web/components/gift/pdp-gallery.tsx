'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type TransitionEvent as ReactTransitionEvent,
} from 'react';
import { Play } from 'lucide-react';
import { PlayIcon, type PlayIconHandle } from 'lucide-animated';
import { useOnceIcon } from '@/components/gift/use-once-icon';
import { realIndex } from '@/components/gift/pdp-gallery-math';
import { GiftImage } from '@/components/gift/gift-image';

type Media = {
  url: string;
  altText: string | null;
  kind?: 'IMAGE' | 'VIDEO';
  posterUrl?: string | null;
  blurDataUrl?: string | null;
};

const AUTO_MS = 4500;
const SWIPE_PX = 48;
const LOCK_PX = 10;

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  dx: number;
  axis: 'x' | 'y' | null;
};

export function PdpGallery({ media, title }: { media: Media[]; title: string }) {
  const [activePos, setActivePos] = useState(0);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [dragDx, setDragDx] = useState(0);
  const [holding, setHolding] = useState(false);
  const [hoverPause, setHoverPause] = useState(false);
  const [focusPause, setFocusPause] = useState(false);
  const [pageHidden, setPageHidden] = useState(false);
  const [jump, setJump] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const playIcon = useOnceIcon<PlayIconHandle>();
  const drag = useRef<DragState | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const mediaKey = useMemo(() => media.map((m) => m.url).join('\0'), [media]);
  const n = media.length;
  const multi = n > 1;
  const slides = useMemo(() => (multi ? [media[n - 1]!, ...media, media[0]!] : media), [media, multi, n]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const onVis = () => setPageHidden(document.hidden);
    onVis();
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => {
    setActivePos(multi ? 1 : 0);
    setVideoPlaying(false);
    setDragDx(0);
    setJump(false);
  }, [mediaKey, multi]);

  const safePos = slides.length === 0 ? 0 : Math.min(activePos, slides.length - 1);
  const safeIndex = realIndex(safePos, n, multi);
  const current = media[safeIndex];
  const isVideo = current?.kind === 'VIDEO';
  const dragging = holding && drag.current?.axis === 'x';
  const autoPaused =
    reduceMotion || hoverPause || focusPause || pageHidden || holding || (isVideo && videoPlaying);

  const go = useCallback(
    (dir: -1 | 1) => {
      if (!multi) return;
      setVideoPlaying(false);
      setActivePos((p) => {
        const next = p + dir;
        if (reduceMotion) {
          if (next <= 0) return n;
          if (next >= n + 1) return 1;
        }
        return next;
      });
    },
    [multi, n, reduceMotion],
  );

  const show = useCallback(
    (index: number) => {
      setVideoPlaying(false);
      setActivePos(multi ? index + 1 : 0);
    },
    [multi],
  );

  useEffect(() => {
    if (!multi || autoPaused) return;
    const t = window.setTimeout(() => go(1), AUTO_MS);
    return () => window.clearTimeout(t);
  }, [multi, autoPaused, safePos, go]);

  useLayoutEffect(() => {
    if (!jump) return;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setJump(false));
    });
    return () => cancelAnimationFrame(id);
  }, [jump, safePos]);

  const onTransitionEnd = (e: ReactTransitionEvent<HTMLDivElement>) => {
    if (e.target !== trackRef.current || e.propertyName !== 'transform' || !multi) return;
    if (safePos === 0) {
      setJump(true);
      setActivePos(n);
    } else if (safePos === n + 1) {
      setJump(true);
      setActivePos(1);
    }
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!multi || e.button !== 0) return;
    if ((e.target as HTMLElement | null)?.closest('button')) return;
    drag.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      dx: 0,
      axis: null,
    };
    setHolding(true);
    setDragDx(0);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (d.axis === null) {
      if (Math.abs(dx) < LOCK_PX && Math.abs(dy) < LOCK_PX) return;
      d.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (d.axis === 'x') {
        e.currentTarget.setPointerCapture(e.pointerId);
      }
    }
    if (d.axis !== 'x') return;
    d.dx = dx;
    setDragDx(dx);
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const dx = d.dx;
    const axis = d.axis;
    drag.current = null;
    setHolding(false);
    setDragDx(0);
    if (axis === 'x' && Math.abs(dx) >= SWIPE_PX) {
      go(dx < 0 ? 1 : -1);
    }
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!multi) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(-1);
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(1);
    }
  };

  const instant = jump || dragging || reduceMotion;
  const trackStyle = {
    transform: `translate3d(calc(${-safePos * 100}% + ${dragging ? dragDx : 0}px), 0, 0)`,
    transition: instant ? 'none' : 'transform 400ms cubic-bezier(0.22, 1, 0.36, 1)',
  };

  return (
    <div
      className="space-y-gs-3"
      onMouseEnter={() => setHoverPause(true)}
      onMouseLeave={() => setHoverPause(false)}
      onFocus={() => setFocusPause(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusPause(false);
      }}
      onKeyDown={onKeyDown}
    >
      <div className="relative">
        <div
          className={`clay-card overflow-hidden touch-pan-y select-none ${multi ? 'cursor-grab active:cursor-grabbing' : ''}`}
          data-lenis-prevent
          data-testid="pdp-gallery"
          role="region"
          aria-roledescription="carousel"
          aria-label={`${title} photos`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {slides.length > 0 ? (
            <div
              ref={trackRef}
              className="flex will-change-transform"
              style={trackStyle}
              onTransitionEnd={onTransitionEnd}
            >
              {slides.map((m, i) => {
                const video = m.kind === 'VIDEO';
                const showVideo = video && videoPlaying && realIndex(i, n, multi) === safeIndex;
                const isLcp = (!multi && i === 0) || (multi && i === 1);
                const near = Math.abs(i - safePos) <= 1;
                return (
                  <div
                    key={`${m.url}-${i}`}
                    className="relative aspect-square w-full min-w-full shrink-0"
                    aria-hidden={realIndex(i, n, multi) !== safeIndex}
                  >
                    {video ? (
                      showVideo ? (
                        <video
                          key={m.url}
                          src={m.url}
                          poster={m.posterUrl ?? undefined}
                          controls
                          autoPlay
                          playsInline
                          className="h-full w-full bg-foreground/5 object-contain"
                        >
                          <track kind="captions" />
                        </video>
                      ) : (
                        <button
                          type="button"
                          className="group relative block h-full w-full"
                          onMouseEnter={playIcon.play}
                          onClick={() => setVideoPlaying(true)}
                          aria-label={`Play video for ${title}`}
                        >
                          <GiftImage
                            src={m.posterUrl || m.url}
                            alt={m.altText ?? title}
                            fill
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            className="object-cover"
                            draggable={false}
                            blurDataUrl={m.blurDataUrl}
                            priority={isLcp}
                            eager={near}
                          />
                          <span className="absolute inset-0 flex items-center justify-center bg-foreground/25 transition group-hover:bg-foreground/35">
                            <span className="flex size-16 items-center justify-center rounded-pill bg-white/95 text-primary shadow-clay">
                              <PlayIcon
                                ref={playIcon.ref}
                                size={28}
                                animateOnHover={false}
                                aria-hidden
                                className="pl-0.5 text-primary"
                              />
                            </span>
                          </span>
                          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/50 to-transparent px-gs-4 py-gs-4 text-left text-body font-medium text-white">
                            See the unboxing
                          </span>
                        </button>
                      )
                    ) : (
                      <GiftImage
                        src={m.url}
                        alt={m.altText ?? title}
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="pointer-events-none select-none object-cover"
                        draggable={false}
                        blurDataUrl={m.blurDataUrl}
                        priority={isLcp}
                        eager={near}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="aspect-square w-full gift-media-fallback" aria-hidden />
          )}
        </div>
        {multi ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-gs-3 flex justify-center gap-gs-2">
            {media.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Photo ${i + 1} of ${n}`}
                aria-current={i === safeIndex}
                onClick={() => show(i)}
                className={`pointer-events-auto h-gs-1 rounded-pill transition-[width,background-color] ${
                  i === safeIndex ? 'w-gs-4 bg-primary' : 'w-gs-1 bg-white/80 shadow-sm'
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>
      {multi ? (
        <ul
          className="-mx-gs-1 flex gap-gs-2 overflow-x-auto px-gs-1 pb-gs-1 [scrollbar-width:thin]"
          aria-label="Product media"
        >
          {media.map((m, i) => (
            <li key={`${m.url}-${i}`} className="shrink-0">
              <button
                type="button"
                onClick={() => show(i)}
                aria-label={
                  m.kind === 'VIDEO'
                    ? `View video ${i + 1} of ${media.length}`
                    : `View image ${i + 1} of ${media.length}`
                }
                aria-pressed={i === safeIndex}
                className={`relative h-14 w-14 overflow-hidden rounded-control border-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:h-20 sm:w-20 ${
                  i === safeIndex
                    ? 'border-primary shadow-clay'
                    : 'border-transparent opacity-80 hover:opacity-100'
                }`}
              >
                <GiftImage
                  src={m.kind === 'VIDEO' ? m.posterUrl || m.url : m.url}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                  blurDataUrl={m.blurDataUrl}
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
