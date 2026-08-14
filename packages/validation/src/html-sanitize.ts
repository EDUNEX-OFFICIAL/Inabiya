import sanitizeHtml from 'sanitize-html';

const ALLOWED_TAGS = [
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
];

function isSafeUri(value: string, kind: 'href' | 'src'): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (kind === 'href' && /^#[\w.-]*$/.test(trimmed)) return true;
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.includes('..')) {
    return true;
  }
  try {
    const u = new URL(trimmed);
    if (kind === 'src') return u.protocol === 'https:' || u.protocol === 'http:';
    return (
      u.protocol === 'https:' ||
      u.protocol === 'http:' ||
      u.protocol === 'mailto:' ||
      u.protocol === 'tel:'
    );
  } catch {
    return false;
  }
}

/**
 * TipTap / CMS HTML allowlist via htmlparser2 (no jsdom).
 * Drops event handlers and unsafe schemes even when markup is slash-joined.
 */
export function sanitizeArticleHtml(html: string): string {
  if (!html) return '';
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'title'],
      th: ['colspan', 'rowspan'],
      td: ['colspan', 'rowspan'],
      '*': ['class'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowProtocolRelative: false,
    transformTags: {
      a: (_tag, attribs) => {
        const href = attribs.href ?? '';
        const next: Record<string, string> = {};
        if (isSafeUri(href, 'href')) next.href = href.trim();
        if (attribs.target === '_blank') {
          next.target = '_blank';
          next.rel = attribs.rel?.trim() || 'noopener noreferrer';
        } else if (attribs.rel) {
          next.rel = attribs.rel;
        }
        if (attribs.class) next.class = attribs.class;
        return { tagName: 'a', attribs: next };
      },
      img: (_tag, attribs) => {
        const src = attribs.src ?? '';
        const next: Record<string, string> = {};
        if (isSafeUri(src, 'src')) next.src = src.trim();
        if (attribs.alt) next.alt = attribs.alt;
        if (attribs.title) next.title = attribs.title;
        if (attribs.class) next.class = attribs.class;
        return { tagName: 'img', attribs: next };
      },
    },
  });
}

export function sanitizeArticleHtmlLite(html: string): string {
  return sanitizeArticleHtml(html);
}

export function normalizeArticleBody(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '<p></p>';
  if (/^\s*</.test(trimmed)) return sanitizeArticleHtml(trimmed);
  const escaped = trimmed.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return escaped
    .split(/\n{2,}/)
    .map((block) => `<p>${block.replace(/\n/g, '<br />')}</p>`)
    .join('');
}

export function isProbablyHtml(raw: string): boolean {
  return /^\s*</.test(raw.trim());
}
