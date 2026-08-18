import { ThemeFontShell } from '@/components/theme-font-shell';

export default function EditorialLoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeFontShell
      theme="blog"
      density="compact"
      className="min-h-screen bg-background text-foreground"
    >
      {children}
    </ThemeFontShell>
  );
}
