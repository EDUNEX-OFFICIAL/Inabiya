import { ThemeFontShell } from '@/components/theme-font-shell';

export default function EditorialAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeFontShell theme="blog" density="compact">
      {children}
    </ThemeFontShell>
  );
}
