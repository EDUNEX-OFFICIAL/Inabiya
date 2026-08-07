import type { ReactNode } from 'react';

type Props = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

/** Shared dense page header for commerce OPS screens. */
export function OpsPageHeader({ title, description, actions }: Props) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-2 sm:gap-3">
      <div className="min-w-0 flex-1 basis-[min(100%,12rem)]">
        <h1 className="font-display text-xl leading-tight sm:text-2xl">{title}</h1>
        {description ? <p className="mt-1 break-words text-sm opacity-70">{description}</p> : null}
      </div>
      {actions ? (
        <div className="flex max-w-full flex-wrap items-center justify-end gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
