'use client';

import { useId, useState, type ReactNode } from 'react';

export type FaqAccordionItem = {
  question: string;
  /** Plain text or sanitized HTML node */
  answer: ReactNode;
};

type Props = {
  title?: string;
  overline?: string;
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
 * Homepage (`home`) uses a split copy + list; PDP stays stacked.
 */
export function FaqAccordion({
  title,
  overline,
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

  const heading = title ? (
    home ? (
      <div className="gift-faq__copy">
        {overline ? <p className="gift-overline">{overline}</p> : null}
        <h2 className={`gift-h1 ${overline ? 'mt-gs-3' : ''} leading-tight`}>{title}</h2>
      </div>
    ) : (
      <h2 className="gift-h2">{title}</h2>
    )
  ) : null;

  const list = (
    <div
      className={
        home ? 'gift-faq__list' : title ? 'mt-gs-4 space-y-gs-3' : 'space-y-gs-3'
      }
    >
      {items.map((item, i) => {
        const open = openIndex === i;
        const panelId = `${uid}-panel-${i}`;
        const btnId = `${uid}-btn-${i}`;
        return (
          <div
            key={`${item.question}-${i}`}
            className={`gift-faq-item clay-panel overflow-hidden transition-[border-color,box-shadow] duration-300 ease-out ${
              open ? 'gift-faq-item--open shadow-clay' : ''
            }`}
          >
            <button
              type="button"
              id={btnId}
              aria-expanded={open}
              aria-controls={panelId}
              className="flex w-full cursor-pointer list-none items-center justify-between gap-gs-3 px-gs-5 py-gs-4 text-left text-body font-medium"
              onClick={() => setOpenIndex(open ? null : i)}
            >
              <span>{item.question}</span>
              <span
                className={`gift-faq-item__icon shrink-0 ${open ? 'gift-faq-item__icon--open' : ''}`}
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
                <div className="border-t border-border-subtle px-gs-5 pb-gs-4 pt-gs-3 text-body leading-relaxed opacity-85">
                  {item.answer}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <section
      id={id}
      className={
        className !== undefined
          ? className
          : home
            ? 'gift-faq'
            : 'max-w-3xl py-gs-2'
      }
    >
      {heading}
      {list}
    </section>
  );
}
