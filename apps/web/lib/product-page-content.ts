import { isProbablyHtml, normalizeArticleBody, sanitizeArticleHtml } from '@/lib/article-html';

export type SeoSectionLike = { heading: string; bodyText: string };

function escapeText(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Merge legacy heading+body rows (or single HTML body) into one TipTap document. */
export function seoSectionsToHtml(
  sections: Array<{ heading: string; bodyText: string }> | null | undefined,
): string {
  if (!sections?.length) return '';
  if (
    sections.length === 1 &&
    !sections[0]!.heading.trim() &&
    isProbablyHtml(sections[0]!.bodyText)
  ) {
    return sanitizeArticleHtml(sections[0]!.bodyText);
  }
  return sections
    .map((s) => {
      const heading = s.heading.trim();
      const body = s.bodyText.trim();
      if (!heading && !body) return '';
      const bodyHtml = isProbablyHtml(body)
        ? sanitizeArticleHtml(body)
        : normalizeArticleBody(body);
      return heading ? `<h2>${escapeText(heading)}</h2>${bodyHtml}` : bodyHtml;
    })
    .filter(Boolean)
    .join('');
}

/** TipTap HTML → storage shape (one body row). Empty editor → null. */
export function htmlToSeoSections(html: string): SeoSectionLike[] | null {
  const cleaned = sanitizeArticleHtml(html).trim();
  if (!cleaned || cleaned === '<p></p>' || cleaned === '<p><br></p>') return null;
  return [{ heading: '', bodyText: cleaned }];
}
