'use client';

import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
  type PointerEvent as ReactPointerEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger);

export type CarouselCategory = 'Create' | 'Develop' | 'Explore';

export type CarouselHoverMedia =
  | { type: 'image'; src: string }
  | { type: 'video'; src: string; poster?: string };

export type CarouselCardData = {
  id: string;
  category: CarouselCategory;
  kicker: string;
  title: string;
  description: string;
  image?: string;
  /** Shown on desktop hover / mobile media tap — image or muted looping video. */
  hoverMedia?: CarouselHoverMedia;
  gradient: string;
  accent: string;
  href: string;
};

/** Editable card data — Soft Gift routes (not CRA paths). */
export const CAROUSEL_CARDS: CarouselCardData[] = [
  {
    id: 'build-box',
    category: 'Create',
    kicker: 'Gift Builder',
    title: 'Build Your Box',
    description:
      'Design a bespoke baby box in six gentle steps — pick recipient, age, occasion & budget, we curate the rest.',
    image: 'https://images.unsplash.com/photo-1622290291720-ac961c43ee30?w=800&q=85',
    hoverMedia: {
      type: 'image',
      src: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&q=85',
    },
    gradient: 'linear-gradient(150deg,#FF6B9D 0%,#FFB5D0 55%,#FFE0EC 100%)',
    accent: '#7C1D3C',
    href: '/gift/build-your-box',
  },
  {
    id: 'keepsakes',
    category: 'Create',
    kicker: 'Personalised',
    title: 'Name & Note Keepsakes',
    description:
      "Add the baby's name, a handwritten gift note and a ribbon colour to make every hamper unmistakably theirs.",
    image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800&q=85',
    hoverMedia: {
      type: 'image',
      src: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&q=85',
    },
    gradient: 'linear-gradient(150deg,#E8D5F5 0%,#F5C8E4 55%,#FFE0EC 100%)',
    accent: '#5B21B6',
    href: '/gift/build-your-box',
  },
  {
    id: 'milestone-toys',
    category: 'Develop',
    kicker: 'Play & Learn',
    title: 'Milestone Toys',
    description:
      'Montessori-inspired wooden toys that grow with baby — sensory, safe and beautifully made for little hands.',
    image: 'https://images.unsplash.com/photo-1609811645795-f72ea07f47e9?w=800&q=85',
    hoverMedia: {
      type: 'image',
      src: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&q=85',
    },
    gradient: 'linear-gradient(150deg,#B5EAD7 0%,#D9F5E9 55%,#E0F7EE 100%)',
    accent: '#0F5132',
    href: '/gift/collections/bestsellers',
  },
  {
    id: 'first-year',
    category: 'Develop',
    kicker: 'Essentials',
    title: 'First-Year Essentials',
    description:
      'Clothing, bath, skincare and feeding staples from baby-safe brands parents actually trust — all in one place.',
    image: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=800&q=85',
    hoverMedia: {
      type: 'image',
      src: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&q=85',
    },
    gradient: 'linear-gradient(150deg,#7DD3FC 0%,#BAE6FD 55%,#E0F2FE 100%)',
    accent: '#0C4A6E',
    href: '/gift/collections/newborn',
  },
  {
    id: 'ready-hampers',
    category: 'Explore',
    kicker: 'Ready to Gift',
    title: 'Ready-Made Hampers',
    description:
      'Beautifully packed, occasion-ready hampers with complimentary wrapping — order in a tap, delivered across India.',
    image: 'https://images.unsplash.com/photo-1635874714425-c342060a4c58?w=800&q=85',
    hoverMedia: {
      type: 'image',
      src: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=85',
    },
    gradient: 'linear-gradient(150deg,#FFD166 0%,#FFE3A3 55%,#FFF4D6 100%)',
    accent: '#7C4A03',
    href: '/gift/collections/ready-hampers',
  },
  {
    id: 'corporate',
    category: 'Explore',
    kicker: 'For Teams',
    title: 'Corporate Gifting',
    description:
      'Thoughtful welcome-baby gifts for your people — branded cards, bulk pricing and PAN-India delivery.',
    image: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800&q=85',
    hoverMedia: {
      type: 'image',
      src: 'https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=800&q=85',
    },
    gradient: 'linear-gradient(150deg,#C7D2FE 0%,#DDD6FE 55%,#EDE9FE 100%)',
    accent: '#3730A3',
    href: '/gift/corporate',
  },
];

const FILTERS = ['All', 'Create', 'Develop', 'Explore'] as const;
type Filter = (typeof FILTERS)[number];

/** Tight smile so neighbours stay on-screen — no hole in the middle. */
function arcTransform(offset: number, step: number) {
  const abs = Math.abs(offset);
  if (abs > 2) {
    return { x: 0, y: 0, rotateZ: 0, rotateY: 0, scale: 0.94, opacity: 0, hidden: true, abs };
  }
  const x = offset * step;
  const y = abs * abs * 28;
  const rotateZ = offset * 8;
  const rotateY = offset * -10;
  const scale = Math.max(1 - abs * 0.06, 0.86);
  const opacity = 1 - abs * 0.08;
  return { x, y, rotateZ, rotateY, scale, opacity, hidden: false, abs };
}

function stepForWidth(w: number) {
  return Math.max(210, Math.min(w * 0.76, 400));
}

/** GSAP layer: t=0 is behind the centre card, t=1 is the seated arc slot. */
function setFanFromPile(el: HTMLElement, finalOffset: number, step: number, t: number) {
  const vis = arcTransform(finalOffset * t, step);
  const fin = arcTransform(finalOffset, step);
  gsap.set(el, {
    x: vis.x - fin.x,
    y: vis.y - fin.y,
    rotation: vis.rotateZ - fin.rotateZ,
    rotationY: vis.rotateY - fin.rotateY,
    scale: fin.scale === 0 ? 1 : vis.scale / fin.scale,
    transformPerspective: 1400,
    force3D: true,
  });
}

function tweenAlongArc(
  tl: gsap.core.Timeline,
  el: HTMLElement,
  off: number,
  getStep: () => number,
  duration: number,
  position: string | number,
) {
  const proxy = { t: 0 };
  tl.to(
    proxy,
    {
      t: 1,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        setFanFromPile(el, off, getStep(), proxy.t);
        // Stay fully hidden until they clear the main card, then snap into view.
        const reveal = 0.2;
        const op = proxy.t <= reveal ? 0 : gsap.utils.clamp(0, 1, (proxy.t - reveal) / 0.18);
        gsap.set(el, {
          opacity: op,
          visibility: op > 0.02 ? 'visible' : 'hidden',
        });
      },
    },
    position,
  );
}

function playDropAndSpread(nodes: HTMLElement[], stage: HTMLElement | null, quicker = false) {
  const items = nodes.map((el) => {
    const off = Number(el.dataset.carouselOffset ?? 0);
    return { el, off, abs: Math.abs(off) };
  });
  const seated = items.filter((i) => i.abs <= 2);
  const clipped = items.filter((i) => i.abs > 2);
  const center = seated.find((i) => i.abs === 0);
  const sides = seated.filter((i) => i.abs !== 0);

  let stepNow = stepForWidth(stage?.offsetWidth ?? 360);
  const getStep = () => stepNow;
  const drop = quicker ? 24 : 108;
  const dropDur = quicker ? 0.32 : 0.52;
  const slideDur = quicker ? 0.42 : 0.72;
  const hold = quicker ? 0.06 : 0.16;

  const tl = gsap.timeline({
    onComplete: () => {
      stage?.setAttribute('data-cards-live', '');
      // Release EVERY wrapper — parked cards must be able to wrap around later.
      items.forEach(({ el }) => {
        gsap.set(el, { clearProps: 'all' });
      });
    },
  });

  tl.add(() => {
    stepNow = stepForWidth(stage?.offsetWidth ?? 360);
    seated.forEach(({ el, off, abs }) => {
      if (abs === 0) {
        gsap.set(el, { y: -drop, x: 0, rotation: 0, scale: 1, opacity: 1, visibility: 'visible' });
      } else {
        setFanFromPile(el, off, stepNow, 0);
        gsap.set(el, { opacity: 0, visibility: 'hidden' });
      }
    });
    clipped.forEach(({ el }) => {
      gsap.set(el, { opacity: 0, visibility: 'hidden' });
    });
  });

  if (center) {
    tl.to(
      center.el,
      { y: 0, duration: dropDur, ease: 'power3.out' },
      '>',
    );
  }

  if (sides.length) {
    tl.addLabel('spread', `+=${hold}`);
    sides.forEach(({ el, off }) => {
      tweenAlongArc(tl, el, off, getStep, slideDur, 'spread');
    });
  }

  return tl;
}

function useFinePointer() {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const sync = () => setFine(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  return fine;
}

function CardMedia({
  card,
  revealAlt,
  onToggleAlt,
  finePointer,
  reduceMotion,
  allowTapSwap,
}: {
  card: CarouselCardData;
  revealAlt: boolean;
  onToggleAlt: () => void;
  finePointer: boolean;
  reduceMotion: boolean;
  /** Mobile tap-to-swap only on the active card (avoids nested button). */
  allowTapSwap: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasAlt = Boolean(card.hoverMedia);
  const showAlt = revealAlt && hasAlt;
  const tapEnabled = hasAlt && !finePointer && allowTapSwap;

  useEffect(() => {
    const v = videoRef.current;
    if (!v || card.hoverMedia?.type !== 'video') return;
    if (showAlt) {
      void v.play().catch(() => undefined);
    } else {
      v.pause();
      v.currentTime = 0;
    }
  }, [showAlt, card.hoverMedia]);

  const onMediaClick = (e: ReactMouseEvent) => {
    if (!tapEnabled) return;
    e.preventDefault();
    e.stopPropagation();
    onToggleAlt();
  };

  return (
    <div
      className={cn(
        'relative aspect-[4/3] overflow-hidden rounded-[1.15rem] sm:aspect-[1/1] sm:rounded-[1.75rem]',
        tapEnabled && 'cursor-pointer',
      )}
      style={{ background: card.gradient }}
      onClick={onMediaClick}
      role={tapEnabled ? 'button' : undefined}
      aria-label={
        tapEnabled
          ? showAlt
            ? `Show original image for ${card.title}`
            : `Preview alternate media for ${card.title}`
          : undefined
      }
      tabIndex={tapEnabled ? 0 : undefined}
      onKeyDown={(e) => {
        if (!tapEnabled) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          onToggleAlt();
        }
      }}
    >
      {/* Base image / gradient wordmark */}
      <div
        className={cn(
          'absolute inset-0 transition-opacity',
          reduceMotion ? 'duration-0' : 'duration-500 ease-out',
          showAlt ? 'opacity-0' : 'opacity-100',
        )}
        aria-hidden={showAlt}
      >
        {card.image ? (
          <Image
            src={card.image}
            alt=""
            fill
            draggable={false}
            sizes="(max-width: 640px) 54vw, 300px"
            className={cn(
              'object-cover transition-transform',
              reduceMotion ? 'duration-0' : 'duration-700 ease-out',
              showAlt ? 'scale-105' : 'scale-100',
            )}
          />
        ) : (
          <div className="absolute inset-0">
            <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/25 blur-2xl" />
            <div className="absolute -left-6 bottom-6 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
            <span
              className="absolute bottom-5 right-5 font-display italic leading-none opacity-25"
              style={{ color: card.accent, fontSize: 'clamp(2.5rem,6vw,4.5rem)' }}
            >
              {card.title.split(' ')[0]}
            </span>
          </div>
        )}
      </div>

      {/* Hover / tap alternate */}
      {card.hoverMedia ? (
        <div
          className={cn(
            'absolute inset-0 transition-opacity',
            reduceMotion ? 'duration-0' : 'duration-500 ease-out',
            showAlt ? 'opacity-100' : 'opacity-0',
          )}
          aria-hidden={!showAlt}
        >
          {card.hoverMedia.type === 'image' ? (
            <Image
              src={card.hoverMedia.src}
              alt=""
              fill
              draggable={false}
              sizes="(max-width: 640px) 54vw, 300px"
              className={cn(
                'object-cover transition-transform',
                reduceMotion ? 'duration-0' : 'duration-700 ease-out',
                showAlt ? 'scale-100' : 'scale-110',
              )}
            />
          ) : (
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-cover"
              src={card.hoverMedia.src}
              poster={card.hoverMedia.poster}
              muted
              playsInline
              loop
              preload="metadata"
            />
          )}
        </div>
      ) : null}

      <span
        className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/92 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest shadow-clay backdrop-blur sm:left-4 sm:top-4 sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-[10px]"
        style={{ color: card.accent }}
      >
        <Sparkles size={11} aria-hidden /> {card.kicker}
      </span>
    </div>
  );
}

function CardBody({ card }: { card: CarouselCardData }) {
  return (
    <>
      <span
        className="hidden text-[11px] font-bold uppercase tracking-[0.2em] sm:inline"
        style={{ color: card.accent }}
      >
        {card.category}
      </span>
      <h3 className="font-display text-[15px] leading-snug text-foreground sm:mt-1 sm:text-xl">
        {card.title}
      </h3>
      <p className="gift-muted mt-1 line-clamp-2 text-xs leading-snug sm:mt-1.5 sm:text-[13px] sm:leading-relaxed">
        {card.description}
      </p>
    </>
  );
}

type CarouselCardProps = {
  card: CarouselCardData;
  index: number;
  offset: number;
  step: number;
  active: boolean;
  onSelect: () => void;
  onMeasure: (id: string, height: number) => void;
  reduceMotion: boolean;
  finePointer: boolean;
};

function CarouselCard({
  card,
  index,
  offset,
  step,
  active,
  onSelect,
  onMeasure,
  reduceMotion,
  finePointer,
}: CarouselCardProps) {
  const { x, y, rotateZ, rotateY, scale, opacity, hidden, abs } = arcTransform(offset, step);
  const shellRef = useRef<HTMLDivElement>(null);
  const [hoverAlt, setHoverAlt] = useState(false);
  const [tapAlt, setTapAlt] = useState(false);
  const revealAlt = finePointer ? hoverAlt : tapAlt;

  useEffect(() => {
    if (!active) setTapAlt(false);
  }, [active]);

  useEffect(() => {
    if (!shellRef.current) return;
    const el = shellRef.current;
    const report = () => onMeasure(card.id, el.offsetHeight);
    report();
    const ro = new ResizeObserver(report);
    ro.observe(el);
    return () => ro.disconnect();
  }, [card.id, onMeasure, active]);

  const cardShell = (
    <>
      <div className="p-2 pb-0 sm:p-3.5 sm:pb-0">
        <CardMedia
          card={card}
          revealAlt={revealAlt}
          onToggleAlt={() => setTapAlt((v) => !v)}
          finePointer={finePointer}
          reduceMotion={reduceMotion}
          allowTapSwap={active}
        />
      </div>
      <div className="px-3 pb-3 pt-2 sm:p-5">
        <CardBody card={card} />
        {active ? (
          <Link
            href={card.href}
            data-testid={`carousel-link-${card.id}`}
            className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-bold text-foreground transition-all hover:gap-2.5 sm:mt-3 sm:text-sm"
          >
            Learn More
            <ArrowRight size={15} className="text-primary" aria-hidden />
          </Link>
        ) : (
          <span className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-body/50 sm:mt-3 sm:text-sm">
            Learn More <ArrowRight size={15} aria-hidden />
          </span>
        )}
      </div>
    </>
  );

  return (
    <div
      className="absolute left-1/2 top-0 select-none"
      style={{
        width: 'clamp(176px, 54vw, 300px)',
        zIndex: 100 - abs,
        transform: 'translateX(-50%)',
      }}
      aria-hidden={hidden}
      onMouseEnter={() => {
        if (finePointer && card.hoverMedia) setHoverAlt(true);
      }}
      onMouseLeave={() => {
        if (finePointer) setHoverAlt(false);
      }}
    >
      {/* GSAP entrance layer — arc transforms stay on the shell below */}
      <div
        data-carousel-card=""
        data-carousel-index={String(index)}
        data-carousel-offset={String(offset)}
        data-parked={hidden ? '' : undefined}
      >
        <div
          ref={shellRef}
          className="gift-carousel-shell"
          style={{
            transform: `translate3d(${x}px, ${y}px, 0) rotateZ(${rotateZ}deg) rotateY(${rotateY}deg) scale(${scale})`,
            opacity,
            transformStyle: 'preserve-3d',
            willChange: 'transform, opacity',
          }}
        >
          {active ? (
            <article
              data-testid={`carousel-card-${card.id}`}
              className="group block w-full overflow-hidden rounded-[1.5rem] bg-white text-left shadow-[0_16px_48px_color-mix(in_srgb,var(--inabiya-heading)_12%,transparent)] ring-2 ring-primary/25 sm:rounded-[2.25rem]"
            >
              {cardShell}
            </article>
          ) : (
            <button
              type="button"
              onClick={onSelect}
              disabled={hidden}
              data-testid={`carousel-card-${card.id}`}
              className="group block w-full cursor-pointer overflow-hidden rounded-[1.5rem] bg-white text-left shadow-clay transition-shadow duration-300 hover:shadow-[0_16px_44px_color-mix(in_srgb,var(--inabiya-heading)_12%,transparent)] sm:rounded-[2.25rem]"
              aria-label={`View ${card.title}`}
              tabIndex={hidden ? -1 : 0}
            >
              {cardShell}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function CategoryCarousel() {
  const [filter, setFilter] = useState<Filter>('All');
  const [active, setActive] = useState(0);
  const [step, setStep] = useState(260);
  const [stageH, setStageH] = useState(480);
  const [reduceMotion, setReduceMotion] = useState(false);
  const finePointer = useFinePointer();
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const heightsRef = useRef<Record<string, number>>({});
  const drag = useRef({ startX: 0, dragging: false, moved: false });
  const enteredRef = useRef(false);

  const cards = useMemo(
    () =>
      filter === 'All' ? CAROUSEL_CARDS : CAROUSEL_CARDS.filter((c) => c.category === filter),
    [filter],
  );
  const n = cards.length;

  useLayoutEffect(() => {
    setActive(0);
    heightsRef.current = {};
    stageRef.current?.removeAttribute('data-cards-live');
  }, [filter]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  /** Scroll-in: one card drops in, then equal L/R cards slide out along the smile. */
  useGSAP(
    () => {
      const root = sectionRef.current;
      if (!root) return;

      const intro = root.querySelectorAll<HTMLElement>('[data-carousel-intro]');
      const controls = root.querySelectorAll<HTMLElement>('[data-carousel-controls]');
      const cardNodes = gsap.utils.toArray<HTMLElement>(root.querySelectorAll('[data-carousel-card]'));

      if (reduceMotion) {
        stageRef.current?.setAttribute('data-cards-live', '');
        gsap.set([...intro, ...cardNodes, ...controls], {
          clearProps: 'all',
          opacity: 1,
          y: 0,
          scale: 1,
          rotate: 0,
          visibility: 'visible',
        });
        enteredRef.current = true;
        return;
      }

      const stage = stageRef.current;

      if (enteredRef.current) {
        stage?.removeAttribute('data-cards-live');
        if (!cardNodes.length) return;
        playDropAndSpread(cardNodes, stage, true);
        return;
      }

      gsap.set(intro, { opacity: 0, y: 28 });
      gsap.set(controls, { opacity: 0, y: 18 });

      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
        scrollTrigger: {
          trigger: root,
          start: 'top 78%',
          once: true,
        },
        onComplete: () => {
          enteredRef.current = true;
        },
      });

      tl.to(intro, {
        opacity: 1,
        y: 0,
        duration: 0.65,
        stagger: 0.1,
      });

      if (cardNodes.length) {
        tl.add(playDropAndSpread(cardNodes, stage), '-=0.2');
      } else {
        stage?.setAttribute('data-cards-live', '');
      }

      tl.to(
        controls,
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
        },
        '-=0.35',
      );
    },
    { scope: sectionRef, dependencies: [filter, reduceMotion, cards.length] },
  );

  const reportHeight = useCallback((id: string, h: number) => {
    heightsRef.current[id] = h;
    const vals = Object.values(heightsRef.current);
    if (!vals.length) return;
    // Wider fan needs room under the smile.
    const max = Math.max(...vals) + 112;
    setStageH((prev) => (Math.abs(prev - max) > 1 ? max : prev));
  }, []);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.offsetWidth;
      setStep(stepForWidth(w));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const go = useCallback(
    (dir: number) => {
      if (n < 1) return;
      setActive((a) => (a + dir + n) % n);
    },
    [n],
  );

  const offsetOf = useCallback(
    (i: number) => {
      if (n < 1) return 0;
      let off = i - active;
      if (off >= n / 2) off -= n;
      if (off < -n / 2) off += n;
      return off;
    },
    [active, n],
  );

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage?.hasAttribute('data-cards-live')) return;
    stage.querySelectorAll<HTMLElement>('[data-carousel-card]').forEach((el) => {
      gsap.set(el, { clearProps: 'opacity,visibility,transform,transformPerspective' });
    });
  }, [active]);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    drag.current = { startX: e.clientX, dragging: true, moved: false };
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current.dragging) return;
    if (Math.abs(e.clientX - drag.current.startX) > 12) drag.current.moved = true;
  };
  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current.dragging) return;
    const dx = e.clientX - drag.current.startX;
    const moved = drag.current.moved;
    drag.current.dragging = false;
    if (moved && Math.abs(dx) > 55) go(dx < 0 ? 1 : -1);
  };
  const onPointerCancel = () => {
    drag.current.dragging = false;
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(-1);
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(1);
    }
  };

  return (
    <section
      ref={sectionRef}
      id="explore-carousel"
      data-testid="category-carousel"
      className="relative overflow-hidden py-gs-7 lg:py-gs-8"
    >
      {/* Soft Gift ambient shapes (Labs energy, Inabiya pastels) */}
      <div
        className="pointer-events-none absolute -top-16 left-1/2 h-[22rem] w-[36rem] -translate-x-1/2 rounded-[50%] bg-[color-mix(in_srgb,var(--inabiya-sky)_55%,transparent)] blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-10 top-1/3 h-72 w-72 rounded-[2.5rem] bg-[color-mix(in_srgb,var(--inabiya-mint)_45%,transparent)] blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-8 bottom-8 h-80 w-80 rounded-[2rem] bg-[color-mix(in_srgb,var(--inabiya-blush)_55%,transparent)] blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-24 left-1/4 h-56 w-56 rounded-full bg-[color-mix(in_srgb,var(--inabiya-lavender)_40%,transparent)] blur-3xl"
        aria-hidden
      />

      <div className="gift-shell-width relative">
        <div className="mx-auto max-w-2xl text-center">
          <span
            data-carousel-intro=""
            className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary shadow-clay"
          >
            <Sparkles size={12} aria-hidden /> Explore Inabiya
          </span>
          <h2
            data-carousel-intro=""
            className="mt-gs-4 font-display text-[clamp(2rem,5vw,3.75rem)] font-medium leading-[1.05] text-foreground"
          >
            A different way to <span className="italic text-primary">gift</span>
          </h2>
          <p data-carousel-intro="" className="gift-muted mt-gs-4 text-base sm:text-lg">
            Swipe through the ways to gift with Inabiya — create, develop and explore, all in one
            place.
          </p>
        </div>

        {/* Tabs stay above the stage (client + human preference) */}
        <div
          data-carousel-intro=""
          className="mt-gs-5 flex flex-wrap items-center justify-center gap-2.5"
          data-testid="carousel-filters"
          role="tablist"
          aria-label="Category filters"
        >
          {FILTERS.map((f) => {
            const selected = filter === f;
            return (
              <button
                key={f}
                type="button"
                role="tab"
                aria-selected={selected}
                data-testid={`carousel-filter-${f.toLowerCase()}`}
                onClick={() => {
                  setFilter(f);
                  setActive(0);
                }}
                className={cn(
                  'rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
                  selected
                    ? 'border-transparent bg-[var(--inabiya-heading)] text-white'
                    : 'border-border-subtle bg-white/90 text-foreground hover:border-border-strong',
                )}
              >
                {f}
              </button>
            );
          })}
        </div>

        <div
          ref={stageRef}
          data-testid="carousel-stage"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onPointerCancel={onPointerCancel}
          onKeyDown={onKeyDown}
          tabIndex={0}
          role="group"
          aria-roledescription="carousel"
          aria-label="Category cards"
          className="relative mt-gs-6 touch-pan-y outline-none"
          style={{
            perspective: '1800px',
            perspectiveOrigin: '50% 35%',
            height: stageH,
          }}
        >
          {cards.map((card, i) => (
            <CarouselCard
              key={card.id}
              card={card}
              index={i}
              offset={offsetOf(i)}
              step={step}
              active={offsetOf(i) === 0}
              onSelect={() => setActive(i)}
              onMeasure={reportHeight}
              reduceMotion={reduceMotion}
              finePointer={finePointer}
            />
          ))}
        </div>

        <div
          data-carousel-controls=""
          className="relative mx-auto mt-gs-4 flex max-w-xs items-center justify-center gap-gs-4"
          data-testid="carousel-controls"
        >
          <button
            type="button"
            onClick={() => go(-1)}
            data-testid="carousel-prev"
            aria-label="Previous card"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-foreground shadow-clay transition-all hover:bg-primary hover:text-primary-foreground active:scale-95"
          >
            <ChevronLeft size={20} aria-hidden />
          </button>

          <div className="flex items-center gap-2" data-testid="carousel-dots">
            {cards.map((c, i) => {
              const isCurrent = offsetOf(i) === 0;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActive(i)}
                  data-testid={`carousel-dot-${i}`}
                  aria-label={`Go to ${c.title}`}
                  aria-current={isCurrent || undefined}
                  className={cn(
                    'h-2 rounded-full transition-all duration-300',
                    isCurrent
                      ? 'w-7 bg-primary'
                      : 'w-2 bg-[color-mix(in_srgb,var(--inabiya-heading)_20%,transparent)] hover:bg-[color-mix(in_srgb,var(--inabiya-heading)_40%,transparent)]',
                  )}
                />
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => go(1)}
            data-testid="carousel-next"
            aria-label="Next card"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-foreground shadow-clay transition-all hover:bg-primary hover:text-primary-foreground active:scale-95"
          >
            <ChevronRight size={20} aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}
