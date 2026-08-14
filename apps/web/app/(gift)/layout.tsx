import { GiftLayoutChrome } from '@/components/gift/gift-layout-chrome';
import './gift-hero-fouc.css';

export default function GiftLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="gift" className="clay-shell flex min-h-screen flex-col text-foreground">
      <GiftLayoutChrome>{children}</GiftLayoutChrome>
    </div>
  );
}
