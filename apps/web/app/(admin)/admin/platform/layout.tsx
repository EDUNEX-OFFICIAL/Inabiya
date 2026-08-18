import { ThemeFontShell } from '@/components/theme-font-shell';

export default function PlatformAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeFontShell theme="gift" density="compact">
      {children}
    </ThemeFontShell>
  );
}
