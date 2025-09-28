import { z } from 'zod';

export const createProposalSchema = z.object({
  lead_id: z.string().optional(),
  event_id: z.string().optional(),
  items: z.array(z.object({
    item_type: z.enum(['room_hire', 'menu_item', 'package', 'addon', 'discount', 'service']),
    item_id: z.string(),
    name_snapshot: z.string(),
    price_snapshot: z.number(),
    quantity: z.number().min(1),
  })),
  owner_user_id: z.string().optional(),
});

export type CreateProposalInput = z.infer<typeof createProposalSchema>;
