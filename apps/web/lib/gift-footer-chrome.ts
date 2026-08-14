export function formatFooterCopyright(
  tpl: string | undefined,
  year: number,
  brand: string,
): string {
  const raw = tpl?.trim() || '© {year} {brand}. Soft gifts for tiny humans.';
  return raw.replaceAll('{year}', String(year)).replaceAll('{brand}', brand);
}
