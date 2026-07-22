'use client';

import { useId, useState, type ReactNode } from 'react';

export type FaqAccordionItem = {
  question: string;
  /** Plain text or sanitized HTML node */
  answer: ReactNode;
};

type Props = {
  title?: string;
  items: FaqAccordionItem[];
  /** Index open on mount; `null` = all closed */
  defaultOpenIndex?: number | null;
  className?: string;
  home?: boolean;
  id?: string;
};

/**
 * Soft Gift FAQ accordion — height eases open/close (grid 0fr→1fr).
 * Prefer over raw `<details>` which cannot animate smoothly.
 */
export function FaqAccordion({
  title,
  items,
  defaultOpenIndex = 0,
  className,
  home,
  id,
}: Props) {
  const uid = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(
    defaultOpenIndex == null || items.length === 0
      ? null
      : Math.min(Math.max(0, defaultOpenIndex), items.length - 1),
  );

  if (items.length === 0) return null;

  return (
    <section
      id={id}
      className={
        className !== undefined
          ? className
          : home
            ? 'mx-auto max-w-3xl px-gs-4 py-gs-6 sm:px-gs-6'
            : 'max-w-3xl py-gs-2'
      }
    >
      {title ? <h2 className="gift-h2">{title}</h2> : null}
      <div className={title ? 'mt-gs-4 space-y-gs-3' : 'space-y-gs-3'}>
        {items.map((item, i) => {
          const open = openIndex === i;
          const panelId = `${uid}-panel-${i}`;
          const btnId = `${uid}-btn-${i}`;
          return (
            <div
              key={`${item.question}-${i}`}
              className={`clay-panel overflow-hidden transition-shadow duration-300 ease-out ${
                open ? 'shadow-clay' : ''
              }`}
            >
              <button
                type="button"
                id={btnId}
                aria-expanded={open}
                aria-controls={panelId}
                className="flex w-full cursor-pointer list-none items-center justify-between gap-gs-3 px-gs-5 py-gs-4 text-left text-sm font-medium"
                onClick={() => setOpenIndex(open ? null : i)}
              >
                <span>{item.question}</span>
                <span
                  className={`shrink-0 text-base leading-none opacity-50 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    open ? 'rotate-45' : 'rotate-0'
                  }`}
                  aria-hidden
                >
                  +
                </span>
              </button>
              <div
                id={panelId}
                role="region"
                aria-labelledby={btnId}
                className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
              >
                <div className="min-h-0 overflow-hidden">
                  <div className="border-t border-border-subtle px-gs-5 pb-gs-4 pt-gs-3 text-sm leading-relaxed opacity-85">
                    {item.answer}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function faqPageJsonLd(
  items: Array<{ question: string; answerText: string }>,
): Record<string, unknown> | null {
  const entities = items
    .map((item) => {
      const text = item.answerText.replace(/\s+/g, ' ').trim();
      if (!item.question.trim() || !text) return null;
      return {
        '@type': 'Question',
        name: item.question.trim(),
        acceptedAnswer: { '@type': 'Answer', text },
      };
    })
    .filter(Boolean);
  if (entities.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entities,
  };
}
