'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes } from 'react';

const labelVisibility = {
  always: '',
  sm: 'hidden sm:inline',
  md: 'hidden md:inline',
  never: 'sr-only',
} as const;

type LabelMode = keyof typeof labelVisibility;

type Shared = {
  label: string;
  icon: LucideIcon;
  /** When the text label appears. Default `sm` (icon-only on phones). */
  labelFrom?: LabelMode;
  className?: string;
  variant?: 'ghost' | 'secondary';
};

function actionClass(variant: 'ghost' | 'secondary' = 'ghost', className?: string) {
  const base =
    variant === 'secondary'
      ? 'clay-btn-secondary inline-flex h-8 items-center justify-center gap-1.5 px-2 text-xs sm:h-9 sm:px-2.5'
      : 'clay-btn-ghost inline-flex h-8 items-center justify-center gap-1.5 px-2 text-xs sm:h-9 sm:px-2.5';
  return `${base} ${className ?? ''}`.trim();
}

function ActionInner({
  label,
  icon: Icon,
  labelFrom = 'sm',
}: {
  label: string;
  icon: LucideIcon;
  labelFrom?: LabelMode;
}) {
  return (
    <>
      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
      <span className={labelVisibility[labelFrom]}>{label}</span>
    </>
  );
}

/** Secondary ops control: icon on mobile, icon+label from `labelFrom` up. */
export function OpsIconButton({
  label,
  icon,
  labelFrom = 'sm',
  className,
  variant = 'ghost',
  type = 'button',
  ...rest
}: Shared & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={actionClass(variant, className)}
      {...rest}
    >
      <ActionInner label={label} icon={icon} labelFrom={labelFrom} />
    </button>
  );
}

/** Same density pattern for internal/external links. */
export function OpsIconLink({
  label,
  icon,
  labelFrom = 'sm',
  className,
  variant = 'ghost',
  href,
  target,
  rel,
}: Shared & {
  href: string;
  target?: string;
  rel?: string;
}) {
  const external = target === '_blank';
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className={actionClass(variant, className)}
      target={target}
      rel={rel ?? (external ? 'noreferrer' : undefined)}
    >
      <ActionInner label={label} icon={icon} labelFrom={labelFrom} />
    </Link>
  );
}

/** File-picker trigger styled like OpsIconButton (uses `<label>` + hidden input). */
export function OpsIconFileLabel({
  label,
  icon,
  labelFrom = 'sm',
  className,
  variant = 'secondary',
  busy,
  busyLabel = 'Uploading…',
  inputProps,
  ...rest
}: Shared &
  Omit<LabelHTMLAttributes<HTMLLabelElement>, 'children'> & {
    busy?: boolean;
    busyLabel?: string;
    inputProps: InputHTMLAttributes<HTMLInputElement>;
  }) {
  const shown = busy ? busyLabel : label;
  return (
    <label
      aria-label={shown}
      title={shown}
      className={`${actionClass(variant, className)} cursor-pointer ${busy ? 'opacity-60' : ''}`}
      {...rest}
    >
      <ActionInner label={shown} icon={icon} labelFrom={labelFrom} />
      <input type="file" className="hidden" disabled={busy} {...inputProps} />
    </label>
  );
}
