import { ThemeFontShell } from '@/components/theme-font-shell';

export default function CreatorAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeFontShell theme="creator" density="compact">
      {children}
    </ThemeFontShell>
  );
}
