import { CommerceOpsShell } from '@/components/commerce-ops/commerce-ops-shell';

export default function CommerceAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="gift" data-density="compact">
      <CommerceOpsShell>{children}</CommerceOpsShell>
    </div>
  );
}
