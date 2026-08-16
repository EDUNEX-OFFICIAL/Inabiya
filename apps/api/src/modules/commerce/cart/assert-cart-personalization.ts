import { BadRequestException } from '@nestjs/common';

export type CatalogPersonalizationOpt = {
  key: string;
  label: string;
  type: string;
  maxLength: number | null;
  options: unknown;
  required: boolean;
};

function selectChoices(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    .map((v) => v.trim());
}

/** Validate shopper personalization against product catalog options. */
export function assertCartPersonalization(
  opts: CatalogPersonalizationOpt[],
  input?: Record<string, string>,
): Record<string, string> | undefined {
  const values = input ?? {};
  const allowed = new Set(opts.map((o) => o.key));
  for (const key of Object.keys(values)) {
    if (!allowed.has(key)) {
      throw new BadRequestException({
        code: 'INVALID_PERSONALIZATION',
        message: `Unknown personalization field: ${key}`,
      });
    }
  }

  const out: Record<string, string> = {};
  for (const opt of opts) {
    const raw = values[opt.key];
    const value = typeof raw === 'string' ? raw.trim() : '';
    if (!value) {
      if (opt.required) {
        throw new BadRequestException({
          code: 'PERSONALIZATION_REQUIRED',
          message: `Please fill in ${opt.label}`,
        });
      }
      continue;
    }
    if (opt.type === 'SELECT') {
      const choices = selectChoices(opt.options);
      if (!choices.includes(value)) {
        throw new BadRequestException({
          code: 'INVALID_PERSONALIZATION',
          message: `Invalid choice for ${opt.label}`,
        });
      }
    } else if (opt.maxLength != null && value.length > opt.maxLength) {
      throw new BadRequestException({
        code: 'PERSONALIZATION_TOO_LONG',
        message: `${opt.label} must be ${opt.maxLength} characters or less.`,
      });
    }
    out[opt.key] = value;
  }
  return Object.keys(out).length ? out : undefined;
}
