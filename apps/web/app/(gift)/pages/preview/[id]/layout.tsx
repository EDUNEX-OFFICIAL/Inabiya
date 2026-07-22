import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Preview | Inabiya CMS',
  robots: { index: false, follow: false },
};

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
