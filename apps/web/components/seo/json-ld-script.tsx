/** RSC-safe JSON-LD script tag — pass already-merged Schema.org document. */
export function jsonLdToScriptHtml(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export function JsonLdScript({ data }: { data: Record<string, unknown> | null | undefined }) {
  if (!data) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLdToScriptHtml(data) }}
    />
  );
}
