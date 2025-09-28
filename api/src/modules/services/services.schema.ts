import { z } from 'zod';

export const createServiceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  active: z.boolean().optional().default(true),
});

export const updateServiceSchema = createServiceSchema.partial();

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
