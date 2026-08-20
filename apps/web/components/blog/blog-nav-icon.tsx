import { BookOpen, Gift, UsersRound, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const BLOG_NAV_ICONS: Record<string, LucideIcon> = {
  journal: BookOpen,
  specialists: UsersRound,
  shop: Gift,
};

type Props = {
  id: string;
  className?: string;
};

/** Lucide glyph for public Journal chrome nav ids. */
export function BlogNavIcon({ id, className }: Props) {
  const Icon = BLOG_NAV_ICONS[id];
  if (!Icon) return null;
  return <Icon className={cn('blog-nav__icon', className)} strokeWidth={1.5} aria-hidden />;
}
