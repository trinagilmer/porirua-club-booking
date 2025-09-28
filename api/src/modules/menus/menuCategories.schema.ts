import { z } from 'zod';

export const createMenuCategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  active: z.boolean().optional().default(true),
});

export type CreateMenuCategoryInput = z.infer<typeof createMenuCategorySchema>;
