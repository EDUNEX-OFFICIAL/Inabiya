import { CommerceOpsShell } from '@/components/commerce-ops/commerce-ops-shell';
import { ThemeFontShell } from '@/components/theme-font-shell';

export default function CommerceAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeFontShell theme="gift" density="compact">
      <CommerceOpsShell>{children}</CommerceOpsShell>
    </ThemeFontShell>
  );
}
