import { z } from 'zod';

// ─── Audit validators ────────────────────────────────────────────────────────

export const CreateAuditSchema = z.object({
  url: z
    .string()
    .url('Must be a valid URL')
    .max(2048, 'URL too long')
    .refine(
      (url) => url.startsWith('http://') || url.startsWith('https://'),
      'Only http:// and https:// URLs are allowed'
    ),
  options: z
    .object({
      categories: z
        .array(
          z.enum(['performance', 'accessibility', 'best-practices', 'seo'])
        )
        .min(1, 'At least one category required')
        .max(4)
        .default(['performance', 'accessibility', 'best-practices', 'seo']),
      device: z.enum(['mobile', 'desktop']).default('mobile'),
      throttling: z.enum(['simulated', 'devtools', 'none']).default('simulated'),
    })
    .default({}),
});

export const ListAuditsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z
    .enum(['QUEUED', 'RUNNING', 'COMPLETE', 'FAILED'])
    .optional(),
  sort: z.enum(['created_at', 'completed_at', 'url']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const AuditIdSchema = z.object({
  id: z.string().uuid('Invalid audit ID'),
});

// ─── Report validators ───────────────────────────────────────────────────────

export const ShareTokenSchema = z.object({
  shareToken: z.string().min(1).max(128),
});

export const GenerateReportSchema = z.object({
  expiresInDays: z.coerce.number().int().min(1).max(90).default(30),
  isPublic: z.boolean().default(true),
});

// ─── Type exports ────────────────────────────────────────────────────────────

export type CreateAuditInput = z.infer<typeof CreateAuditSchema>;
export type ListAuditsInput = z.infer<typeof ListAuditsSchema>;
export type GenerateReportInput = z.infer<typeof GenerateReportSchema>;
