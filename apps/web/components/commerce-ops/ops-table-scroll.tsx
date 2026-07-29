import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  className?: string;
};

/** Horizontal scroll wrapper so dense ops tables never blow past the viewport. */
export function OpsTableScroll({ children, className = '' }: Props) {
  return (
    <div className={`-mx-1 overflow-x-auto overscroll-x-contain sm:mx-0 ${className}`}>
      <div className="inline-block min-w-full align-middle px-1 sm:px-0">{children}</div>
    </div>
  );
}
