import type { Metadata } from 'next';
import { brandAssets } from '@/lib/brand-assets';
import './globals.css';

export const metadata: Metadata = {
  title: 'Inabiya',
  description: 'Inabiya — gift commerce, editorial, creator collective',
  icons: {
    icon: [
      { url: brandAssets.faviconSvg, type: 'image/svg+xml' },
      { url: brandAssets.favicon, sizes: 'any' },
      { url: brandAssets.icon192, sizes: '192x192', type: 'image/png' },
      { url: brandAssets.icon512, sizes: '512x512', type: 'image/png' },
    ],
    apple: brandAssets.appleTouchIcon,
  },
  openGraph: {
    title: 'Inabiya',
    description: 'Curated with love, for little ones',
    images: [{ url: brandAssets.lockupSquare1080, width: 1080, height: 1080, alt: 'Inabiya' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
