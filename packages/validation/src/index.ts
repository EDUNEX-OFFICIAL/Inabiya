import { z } from 'zod';

/** Shared health/version response shapes — expand in later phases. */
export const healthResponseSchema = z.object({
  status: z.literal('ok'),
});

export const readyResponseSchema = z.object({
  status: z.enum(['ready', 'degraded']),
  checks: z.object({
    database: z.boolean(),
    redis: z.boolean(),
  }),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
export type ReadyResponse = z.infer<typeof readyResponseSchema>;
