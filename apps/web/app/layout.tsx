import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Inabiya',
  description: 'Inabiya platform — Phase 0 foundation',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
