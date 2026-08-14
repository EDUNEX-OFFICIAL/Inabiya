import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes, ComponentProps } from 'react';
import { safeHrefOrHash } from '@inabiya/validation';
import { cn } from '@/lib/utils';

const variants = {
  primary: 'clay-btn',
  secondary: 'clay-btn-secondary',
} as const;

type LabelFrom = 'container' | 'always';

type Shared = {
  label: string;
  icon: LucideIcon;
  /** `container` = icon-only when the nearest `.gift-cta-host` is narrow. */
  labelFrom?: LabelFrom;
  iconPosition?: 'start' | 'end';
  variant?: keyof typeof variants;
  className?: string;
};

function CtaInner({ label, icon: Icon, iconPosition = 'start', labelFrom = 'container' }: Shared) {
  const iconEl = <Icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />;
  const textEl = (
    <span className={labelFrom === 'container' ? 'gift-cta-label' : undefined} aria-hidden>
      {label}
    </span>
  );
  return iconPosition === 'end' ? (
    <>
      {textEl}
      {iconEl}
    </>
  ) : (
    <>
      {iconEl}
      {textEl}
    </>
  );
}

function ctaClass({
  variant = 'primary',
  labelFrom = 'container',
  className,
}: Pick<Shared, 'variant' | 'labelFrom' | 'className'>) {
  return cn(
    variants[variant],
    'gift-cta-responsive inline-flex shrink-0 items-center justify-center gap-gs-2 whitespace-nowrap',
    labelFrom === 'container' && 'gift-cta-responsive--dense',
    className,
  );
}

/** Storefront link: icon+text when the host is wide; icon-only when it is tight. */
export function GiftResponsiveLink({
  href,
  label,
  icon,
  labelFrom = 'container',
  iconPosition = 'start',
  variant = 'primary',
  className,
  ...rest
}: Shared &
  Omit<ComponentProps<typeof Link>, 'children' | 'className' | 'href'> & { href: string }) {
  return (
    <Link
      href={safeHrefOrHash(href)}
      aria-label={label}
      title={label}
      className={ctaClass({ variant, labelFrom, className })}
      {...rest}
    >
      <CtaInner label={label} icon={icon} labelFrom={labelFrom} iconPosition={iconPosition} />
    </Link>
  );
}

/** Storefront button — same density rules as GiftResponsiveLink. */
export function GiftResponsiveButton({
  label,
  icon,
  labelFrom = 'container',
  iconPosition = 'start',
  variant = 'primary',
  className,
  type = 'button',
  ...rest
}: Shared & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={ctaClass({ variant, labelFrom, className })}
      {...rest}
    >
      <CtaInner label={label} icon={icon} labelFrom={labelFrom} iconPosition={iconPosition} />
    </button>
  );
}
