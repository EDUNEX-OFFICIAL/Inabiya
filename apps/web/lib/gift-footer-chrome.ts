export function formatFooterCopyright(
  tpl: string | undefined,
  year: number,
  brand: string,
): string {
  const raw = tpl?.trim() || '© {year} {brand}. Soft gifts for tiny humans.';
  return raw.replaceAll('{year}', String(year)).replaceAll('{brand}', brand);
}

export type CopyrightParts = {
  /** `{year}` token — always current calendar year on storefront */
  yearAuto: boolean;
  /** Used when yearAuto is false */
  yearFixed: number;
  /** Text after `© YEAR BRAND.` */
  suffix: string;
};

const DEFAULT_SUFFIX = 'Soft gifts for tiny humans.';

/**
 * Split a stored copyright template into safe editor parts.
 * Brand is never authored here — always `{brand}` from the Name field.
 */
export function parseCopyrightTpl(
  tpl: string | undefined,
  fallbackYear = new Date().getFullYear(),
): CopyrightParts {
  const raw = (tpl?.trim() || `© {year} {brand}. ${DEFAULT_SUFFIX}`).replace(/\s+/g, ' ');
  const m = raw.match(/^©\s*(?:\{year\}|(\d{4}))\s+\{brand\}\.\s*(.*)$/i);
  if (m) {
    return {
      yearAuto: !m[1],
      yearFixed: m[1] ? Number(m[1]) : fallbackYear,
      suffix: (m[2] ?? '').trim(),
    };
  }
  // Legacy / free-form: keep auto year + brand; leftover as suffix (strip leading © …)
  const stripped = raw
    .replace(/^©\s*/i, '')
    .replace(/\{year\}|\d{4}/i, '')
    .replace(/\{brand\}/i, '')
    .replace(/^\s*\.?\s*/, '')
    .trim();
  return {
    yearAuto: /\{year\}/i.test(raw) || !/\b\d{4}\b/.test(raw),
    yearFixed: (() => {
      const y = raw.match(/\b(20\d{2})\b/);
      return y ? Number(y[1]) : fallbackYear;
    })(),
    suffix: stripped || DEFAULT_SUFFIX,
  };
}

export function composeCopyrightTpl(parts: CopyrightParts): string {
  const year = parts.yearAuto ? '{year}' : String(parts.yearFixed);
  const suffix = parts.suffix.trim();
  return suffix ? `© ${year} {brand}. ${suffix}` : `© ${year} {brand}.`;
}
