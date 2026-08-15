import { faqPageJsonLd } from '@/components/gift/faq-json-ld';

function htmlToText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function parseFaqItems(raw: unknown): Array<{ question: string; answerHtml: string }> {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((row): row is Record<string, unknown> => !!row && typeof row === 'object')
    .map((row) => ({
      question: String(row.question ?? '').trim(),
      answerHtml: String(row.answerHtml ?? '').trim(),
    }))
    .filter((row) => row.question && row.answerHtml)
    .slice(0, 20);
}

function itemsFromProps(props: Record<string, unknown>) {
  if (Array.isArray(props.items)) return parseFaqItems(props.items);
  if (typeof props.itemsJson === 'string') {
    try {
      return parseFaqItems(JSON.parse(props.itemsJson) as unknown);
    } catch {
      return [];
    }
  }
  return [];
}

/** FAQPage JSON-LD from CMS blocks (`items` on storefront, `itemsJson` in the editor). */
export function collectCmsFaqJsonLd(
  blocks: Array<{ type: string; props: Record<string, unknown> }>,
): Record<string, unknown> | null {
  const rows: Array<{ question: string; answerText: string }> = [];
  for (const b of blocks) {
    if (b.type !== 'faq') continue;
    for (const item of itemsFromProps(b.props)) {
      const text = htmlToText(item.answerHtml);
      if (!text) continue;
      rows.push({ question: item.question, answerText: text });
    }
  }
  return faqPageJsonLd(rows);
}
