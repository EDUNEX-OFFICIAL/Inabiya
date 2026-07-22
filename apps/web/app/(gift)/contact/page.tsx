import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contact Inabiya',
  description: 'Reach Soft Gift support by email or WhatsApp.',
};

export default function ContactPage() {
  return (
    <main className="gift-page mx-auto max-w-3xl px-gs-4 py-gs-7 sm:px-gs-6">
      <p className="gift-overline">Hello</p>
      <h1 className="gift-h1 mt-gs-2">We’d love to hear from you</h1>
      <p className="mt-gs-4 max-w-prose text-body opacity-90">
        Questions about an order, personalisation, or corporate gifting? Pick the channel that
        feels easiest.
      </p>

      <ul className="mt-gs-7 space-y-gs-4">
        <li className="clay-panel p-gs-5">
          <p className="font-semibold text-foreground">Email</p>
          <a href="mailto:hello@inabiya.in" className="mt-gs-2 inline-block text-primary hover:underline">
            hello@inabiya.in
          </a>
        </li>
        <li className="clay-panel p-gs-5">
          <p className="font-semibold text-foreground">WhatsApp</p>
          <a
            href="https://wa.me/919693940330"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-gs-2 inline-block text-primary hover:underline"
          >
            +91 96939 40330
          </a>
        </li>
        <li className="clay-panel p-gs-5">
          <p className="font-semibold text-foreground">Corporate gifting</p>
          <Link href="/gift/corporate" className="mt-gs-2 inline-block text-primary hover:underline">
            Request a quote →
          </Link>
        </li>
      </ul>

      <p className="mt-gs-7 text-sm opacity-70">
        Prefer browsing first?{' '}
        <Link href="/gift" className="text-primary hover:underline">
          Back to Soft Gift
        </Link>
      </p>
    </main>
  );
}
