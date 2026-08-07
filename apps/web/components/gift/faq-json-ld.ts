/** Pure FAQ JSON-LD helper — keep out of `'use client'` modules so RSC can call it. */
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
