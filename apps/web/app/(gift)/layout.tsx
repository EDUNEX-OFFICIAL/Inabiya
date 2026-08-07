import { GiftLayoutChrome } from '@/components/gift/gift-layout-chrome';
import { GIFT_HERO_FOUC_CSS } from '@/components/cms/gift-hero-fouc';

export default function GiftLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="gift" className="clay-shell flex min-h-screen flex-col text-foreground">
      {/* Early FOUC CSS (before page children) so hero never paints visible then hides */}
      <style dangerouslySetInnerHTML={{ __html: GIFT_HERO_FOUC_CSS }} />
      <GiftLayoutChrome>{children}</GiftLayoutChrome>
    </div>
  );
}
