import { ThemeFontShell } from '@/components/theme-font-shell';
import { EditorialOpsShell } from '@/components/editorial/editorial-ops-shell';

export default function EditorialAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeFontShell theme="blog" density="compact">
      <EditorialOpsShell>{children}</EditorialOpsShell>
    </ThemeFontShell>
  );
}
