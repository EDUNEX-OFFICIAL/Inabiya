import type { ReactNode } from 'react';

type Props = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

/** Shared dense page header for commerce OPS screens. */
export function OpsPageHeader({ title, description, actions }: Props) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-xl leading-tight sm:text-2xl">{title}</h1>
        {description ? <p className="mt-1 break-words text-sm opacity-70">{description}</p> : null}
      </div>
      {actions ? (
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
