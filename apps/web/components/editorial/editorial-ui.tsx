'use client';

import type { LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { AuthUser } from '@/lib/auth-client';

const labelVisibility = {
  always: '',
  lg: 'hidden lg:inline',
  xl: 'hidden xl:inline',
  never: 'sr-only',
} as const;

type LabelMode = keyof typeof labelVisibility;

export function editorialRoleLabel(roles: string[]): string {
  if (roles.includes('SUPER_ADMIN')) return 'Super admin';
  if (roles.includes('CONTENT_ADMIN')) return 'Content admin';
  if (roles.includes('WRITER')) return 'Writer';
  if (roles.includes('SEO_EDITOR')) return 'SEO';
  if (roles.includes('MEDICAL_REVIEWER')) return 'Medical';
  if (roles.includes('FINANCE')) return 'Finance';
  return roles[0] ?? '—';
}

export function editorialDisplayName(user: AuthUser): string {
  const name = user.displayName?.trim();
  if (name) return name;
  return user.email.split('@')[0] ?? user.email;
}

export function editorialInitials(user: AuthUser): string {
  const base = user.displayName?.trim() || user.email;
  const parts = base.split(/[\s._@-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
  }
  return base.slice(0, 2).toUpperCase();
}

type IconBtnProps = {
  label: string;
  icon: LucideIcon;
  /** Hide text until this breakpoint. Default: always (page actions). */
  labelFrom?: LabelMode;
  variant?: 'primary' | 'secondary' | 'ghost';
} & ButtonHTMLAttributes<HTMLButtonElement>;

function variantClass(variant: IconBtnProps['variant']) {
  if (variant === 'secondary') return 'blog-btn-secondary';
  if (variant === 'ghost') return 'blog-btn-ghost';
  return 'blog-btn';
}

/** Page action: icon + text. Hide the label only when the toolbar would wrap. */
export function EditorialIconButton({
  label,
  icon: Icon,
  labelFrom = 'always',
  variant = 'primary',
  className,
  type = 'button',
  ...rest
}: IconBtnProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`${variantClass(variant)} editorial-action ${className ?? ''}`.trim()}
      {...rest}
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
      <span className={labelVisibility[labelFrom]}>{label}</span>
    </button>
  );
}

export function EditorialEmpty({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <li className="editorial-empty">
      <Icon className="editorial-empty__icon" strokeWidth={1.5} aria-hidden />
      <p>{children}</p>
    </li>
  );
}
