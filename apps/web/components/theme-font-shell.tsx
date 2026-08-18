import type { ReactNode } from 'react';
import { blogFontClass, creatorFontClass, giftFontClass } from '@/lib/theme-fonts';

const FONT: Record<'gift' | 'blog' | 'creator', string> = {
  gift: giftFontClass,
  blog: blogFontClass,
  creator: creatorFontClass,
};

/** Applies `next/font` CSS variables on the themed root. */
export function ThemeFontShell({
  theme,
  density,
  className,
  children,
}: {
  theme: 'gift' | 'blog' | 'creator';
  density?: 'compact';
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      data-theme={theme}
      {...(density ? { 'data-density': density } : {})}
      className={[FONT[theme], className].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  );
}
