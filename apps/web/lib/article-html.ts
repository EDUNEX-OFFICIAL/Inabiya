const ALLOWED_TAGS = new Set([
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'strike',
  'h2',
  'h3',
  'h4',
  'ul',
  'ol',
  'li',
  'blockquote',
  'hr',
  'a',
  'img',
  'pre',
  'code',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'span',
]);

const ALLOWED_ATTR = new Set([
  'href',
  'target',
  'rel',
  'src',
  'alt',
  'title',
  'class',
  'colspan',
  'rowspan',
]);

/**
 * TipTap HTML allowlist without jsdom/DOMPurify.
 * isomorphic-dompurify breaks Next SSR in Docker (missing default-stylesheet.css).
 */
export function sanitizeArticleHtml(html: string): string {
  let out = html
    .replace(/<(script|iframe|object|embed|style|link|meta)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<\/?(script|iframe|object|embed|style|link|meta)\b[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, '');

  out = out.replace(/<\/?([a-z0-9]+)(\s[^>]*)?>/gi, (full, rawTag: string, rawAttrs = '') => {
    const tag = rawTag.toLowerCase();
    const closing = full.startsWith('</');
    if (!ALLOWED_TAGS.has(tag)) return '';
    if (closing) return `</${tag}>`;
    const attrs = pickAttrs(rawAttrs, tag);
    return `<${tag}${attrs}>`;
  });

  return out;
}

/** @deprecated alias — same allowlist sanitizer */
export const sanitizeArticleHtmlLite = sanitizeArticleHtml;

function pickAttrs(rawAttrs: string, tag: string): string {
  if (!rawAttrs?.trim()) return '';
  const kept: string[] = [];
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(rawAttrs))) {
    const attrName = m[1];
    if (!attrName) continue;
    const name = attrName.toLowerCase();
    if (!ALLOWED_ATTR.has(name)) continue;
    const value = m[2] ?? m[3] ?? m[4] ?? '';
    if ((name === 'href' || name === 'src') && /^\s*javascript:/i.test(value)) continue;
    if (name === 'href' || name === 'src') {
      if (!/^(https?:|\/|#|mailto:|tel:)/i.test(value.trim())) continue;
    }
    if (name === 'target' && value !== '_blank') continue;
    kept.push(`${name}="${value.replace(/"/g, '&quot;')}"`);
  }
  if (tag === 'a' && kept.some((a) => a.startsWith('target=')) && !kept.some((a) => a.startsWith('rel='))) {
    kept.push('rel="noopener noreferrer"');
  }
  return kept.length ? ` ${kept.join(' ')}` : '';
}

/** Legacy plain-text drafts → simple HTML paragraphs for TipTap. */
export function normalizeArticleBody(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '<p></p>';
  if (/^\s*</.test(trimmed)) return sanitizeArticleHtml(trimmed);
  const escaped = trimmed.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return escaped
    .split(/\n{2,}/)
    .map((block) => `<p>${block.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export function isProbablyHtml(raw: string): boolean {
  return /^\s*</.test(raw.trim());
}
