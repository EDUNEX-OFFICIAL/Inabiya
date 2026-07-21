'use client';

import { sanitizeArticleHtml, normalizeArticleBody, isProbablyHtml } from '@/lib/article-html';

type Props = {
  body: string;
  className?: string;
};

/** Safe article body render — HTML from TipTap, or plain text fallback. */
export function ArticleBody({ body, className }: Props) {
  if (!body?.trim()) {
    return <p className={`opacity-60 ${className ?? ''}`}>(empty)</p>;
  }
  if (!isProbablyHtml(body)) {
    return (
      <div className={`whitespace-pre-wrap font-body leading-relaxed ${className ?? ''}`}>
        {body}
      </div>
    );
  }
  const html = sanitizeArticleHtml(normalizeArticleBody(body));
  return (
    <div
      className={`article-prose font-body leading-relaxed ${className ?? ''}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
