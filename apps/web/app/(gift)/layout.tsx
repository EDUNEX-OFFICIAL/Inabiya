import { GiftLayoutChrome } from '@/components/gift/gift-layout-chrome';
import { ThemeFontShell } from '@/components/theme-font-shell';
import './gift-hero-fouc.css';

export default function GiftLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeFontShell theme="gift" className="clay-shell flex min-h-screen flex-col text-foreground">
      <GiftLayoutChrome>{children}</GiftLayoutChrome>
    </ThemeFontShell>
  );
}
