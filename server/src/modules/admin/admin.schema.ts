import { z } from 'zod';

export const updatePropertyStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'DRAFT', 'PAUSED']),
});

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  q: z.string().max(100).optional(),
  status: z.string().optional(),
  role: z.string().optional(),
});

export type UpdatePropertyStatusDto = z.infer<typeof updatePropertyStatusSchema>;
export type ListQueryDto = z.infer<typeof listQuerySchema>;
