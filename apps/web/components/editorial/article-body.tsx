import { sanitizeArticleHtml, normalizeArticleBody, isProbablyHtml } from '@/lib/article-html';

type Props = {
  body: string;
  className?: string;
};

/** Safe article body — TipTap HTML or plain text. SSR-safe (no jsdom). */
export function ArticleBody({ body, className }: Props) {
  const base = `font-body leading-relaxed ${className ?? ''}`;

  if (!body?.trim()) {
    return <p className={`opacity-60 ${base}`}>(empty)</p>;
  }

  if (!isProbablyHtml(body)) {
    return <div className={`whitespace-pre-wrap ${base}`}>{body}</div>;
  }

  const html = sanitizeArticleHtml(normalizeArticleBody(body));

  return (
    <div className={`article-prose ${base}`} dangerouslySetInnerHTML={{ __html: html }} />
  );
}
