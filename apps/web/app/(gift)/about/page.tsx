import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About Inabiya',
  description: 'Thoughtfully personalised baby essentials and Soft Gift gifting across India.',
};

export default function AboutPage() {
  return (
    <main className="gift-page mx-auto max-w-3xl px-gs-4 py-gs-7 sm:px-gs-6">
      <p className="gift-overline">Our story</p>
      <h1 className="gift-h1 mt-gs-2">Gifts that feel like a warm hug</h1>
      <p className="mt-gs-4 text-body leading-relaxed opacity-90">
        Inabiya Soft Gift is built for new parents and the people who love them — curated baby-safe
        brands, personalised keepsakes, and ready-made hampers that arrive with care.
      </p>
      <p className="mt-gs-4 text-body leading-relaxed opacity-90">
        We believe gifting should be gentle: fewer decisions, clearer choices, and boxes you would
        be proud to unwrap. From Build Your Box to corporate bulk orders, every path stays soft,
        thoughtful, and India-ready.
      </p>
      <div className="mt-gs-7 flex flex-wrap gap-gs-3">
        <Link href="/gift" className="clay-btn">
          Shop Soft Gift
        </Link>
        <Link href="/contact" className="clay-btn-secondary">
          Contact us
        </Link>
      </div>
    </main>
  );
}
