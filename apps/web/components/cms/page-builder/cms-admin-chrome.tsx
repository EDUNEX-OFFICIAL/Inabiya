'use client';

import { usePathname } from 'next/navigation';
import { CommerceOpsShell } from '@/components/commerce-ops/commerce-ops-shell';

function isBuilderPath(pathname: string): boolean {
  return /^\/admin\/cms\/pages\/(?!new$)[^/]+$/.test(pathname);
}

export function CmsAdminChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  if (isBuilderPath(pathname)) {
    return <div data-theme="gift">{children}</div>;
  }
  return (
    <div data-theme="gift" data-density="compact">
      <CommerceOpsShell>{children}</CommerceOpsShell>
    </div>
  );
}
