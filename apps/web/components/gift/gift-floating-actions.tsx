'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { WhatsAppIcon } from '@/components/gift/whatsapp-icon';

const WA_HREF = 'https://wa.me/919693940330';

export function GiftFloatingActions() {
  const [showTop, setShowTop] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const onMq = () => setReduceMotion(mq.matches);
    mq.addEventListener('change', onMq);
    const onScroll = () => setShowTop(window.scrollY > 400);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      mq.removeEventListener('change', onMq);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-gs-4 right-gs-4 z-40 flex flex-col items-end gap-gs-2 print:hidden sm:bottom-gs-6 sm:right-gs-6">
      {showTop ? (
        <button
          type="button"
          className="pointer-events-auto group flex h-11 w-11 items-center justify-center rounded-pill bg-foreground text-background shadow-clay transition-[background,box-shadow] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          aria-label="Back to top"
          onClick={() => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })}
        >
          <ArrowUp
            className="h-5 w-5 transition-transform duration-150 group-hover:-translate-y-0.5"
            aria-hidden
          />
        </button>
      ) : null}
      <a
        href={WA_HREF}
        target="_blank"
        rel="noopener noreferrer"
        className="pointer-events-auto group flex h-12 w-12 items-center justify-center rounded-pill bg-[color:var(--gift-whatsapp)] text-white shadow-clay transition-[background,box-shadow] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        aria-label="Chat on WhatsApp"
      >
        <WhatsAppIcon className="h-[1.35rem] w-[1.35rem] transition-transform duration-150 group-hover:scale-110" />
      </a>
    </div>
  );
}
