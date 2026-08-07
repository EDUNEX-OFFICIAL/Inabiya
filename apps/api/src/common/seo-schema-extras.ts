import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  parseSeoSchemaExtras,
  seoSchemaExtrasSchema,
  type SeoSchemaEntry,
} from '@inabiya/validation';
import { ZodError } from 'zod';

/** Persist admin Schema.org extras; undefined = leave unchanged. */
export function seoSchemaExtrasWriteValue(
  raw: SeoSchemaEntry[] | null | undefined,
  opts?: { hasSystemFaq?: boolean },
): Prisma.InputJsonValue | typeof Prisma.DbNull | undefined {
  if (raw === undefined) return undefined;
  if (raw === null) return Prisma.DbNull;
  try {
    return parseSeoSchemaExtras(raw, opts) as unknown as Prisma.InputJsonValue;
  } catch (e) {
    if (e instanceof ZodError) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: e.issues[0]?.message ?? 'Invalid seoSchemaExtras',
        issues: e.issues,
      });
    }
    throw e;
  }
}

export function readSeoSchemaExtras(raw: unknown): SeoSchemaEntry[] | null {
  if (raw == null) return null;
  const result = seoSchemaExtrasSchema.safeParse(raw);
  return result.success ? result.data : null;
}

/** True when CMS blocks already emit FAQPage JSON-LD. */
export function cmsBlocksHaveSystemFaq(
  blocks: Array<{ type: string; props: unknown }>,
): boolean {
  for (const b of blocks) {
    if (b.type !== 'faq') continue;
    const props = (b.props ?? {}) as { items?: unknown; itemsJson?: unknown };
    const items = props.items ?? props.itemsJson;
    if (Array.isArray(items) && items.length > 0) return true;
    if (typeof items === 'string' && items.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(items) as unknown;
        if (Array.isArray(parsed) && parsed.length > 0) return true;
      } catch {
        /* ignore */
      }
    }
  }
  return false;
}
