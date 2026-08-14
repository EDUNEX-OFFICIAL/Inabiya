'use client';

import Image from 'next/image';
import type { MouseEvent } from 'react';
import { cn } from '@/lib/utils';
import { splitCardThumbs, type CardThumbItem } from '@/components/gift/card-thumbs';

type Props = {
  items: CardThumbItem[];
  /** When set, thumbs swap the card hero instead of navigating. */
  onSelect?: (id: string) => void;
  activeId?: string;
  /** Gallery: hide a lone duplicate of the hero. Hamper items: show even one. */
  hideIfSingle?: boolean;
  className?: string;
};

export function CardThumbStrip({
  items,
  onSelect,
  activeId,
  hideIfSingle = false,
  className,
}: Props) {
  const { visible, more } = splitCardThumbs(items, { hideIfSingle });
  if (visible.length === 0) return null;

  function select(e: MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    onSelect?.(id);
  }

  return (
    <ul
      className={cn('flex items-center', className)}
      aria-hidden={!onSelect}
      aria-label={onSelect ? 'Product photos' : undefined}
    >
      {visible.map((item, i) => {
        const active = activeId != null && item.id === activeId;
        const thumbClass = cn(
          'relative size-8 overflow-hidden rounded-pill border-2 bg-white/70 shadow-sm',
          active ? 'border-primary' : 'border-border-subtle',
        );
        const inner = item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={onSelect ? (item.alt ?? '') : ''}
            fill
            sizes="32px"
            className="object-cover"
          />
        ) : (
          <div className="gift-media-fallback h-full w-full" aria-hidden />
        );

        return (
          <li key={item.id} style={{ marginLeft: i === 0 ? 0 : -6 }}>
            {onSelect ? (
              <button
                type="button"
                className={cn(thumbClass, 'block')}
                onClick={(e) => select(e, item.id)}
                aria-label={item.alt ? `Show ${item.alt}` : `Show photo ${i + 1}`}
                aria-current={active ? 'true' : undefined}
              >
                {inner}
              </button>
            ) : (
              <div className={thumbClass}>{inner}</div>
            )}
          </li>
        );
      })}
      {more > 0 ? (
        <li
          className="flex size-8 items-center justify-center rounded-pill border-2 border-surface bg-foreground text-caption font-semibold text-background shadow-sm"
          style={{ marginLeft: -6 }}
        >
          +{more}
        </li>
      ) : null}
    </ul>
  );
}
