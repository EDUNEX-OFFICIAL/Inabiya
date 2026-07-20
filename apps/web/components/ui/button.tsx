import * as React from 'react';
import { cn } from '@/lib/utils';

/** Minimal shadcn-style primitive — restyle with tokens later. */
export function Button({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-[var(--radius)] px-4 py-2',
        'bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium',
        'disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}
