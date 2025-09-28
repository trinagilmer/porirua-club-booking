import { z } from 'zod';

export const createLeadSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  status: z.string().optional(),
  owner_user_id: z.string().optional(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
