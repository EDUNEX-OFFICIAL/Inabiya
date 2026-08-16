import { CreatorChrome } from '@/components/creator/creator-chrome';

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="creator" className="creator-shell flex min-h-screen flex-col">
      <CreatorChrome>{children}</CreatorChrome>
    </div>
  );
}
