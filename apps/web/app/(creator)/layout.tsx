import { CreatorChrome } from '@/components/creator/creator-chrome';
import { ThemeFontShell } from '@/components/theme-font-shell';

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeFontShell theme="creator" className="creator-shell flex min-h-screen flex-col">
      <CreatorChrome>{children}</CreatorChrome>
    </ThemeFontShell>
  );
}
