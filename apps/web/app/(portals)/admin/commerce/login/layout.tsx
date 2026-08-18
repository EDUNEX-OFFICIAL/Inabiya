import { ThemeFontShell } from '@/components/theme-font-shell';

export default function CommerceLoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeFontShell
      theme="gift"
      density="compact"
      className="min-h-screen bg-background text-foreground"
    >
      {children}
    </ThemeFontShell>
  );
}
