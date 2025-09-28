import { z } from 'zod';

export const createMenuItemSchema = z.object({
  category_id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  active: z.boolean().optional().default(true),
  price: z.number().optional(),
});

export const updateMenuItemSchema = createMenuItemSchema.partial();

export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
