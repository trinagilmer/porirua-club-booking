import { CreateProposalInput } from './proposals.schema';
import { query } from '../../db';

export async function createProposal(input: CreateProposalInput) {
  const { lead_id, event_id, items, owner_user_id } = input;

  // Snapshot items (names/prices) are assumed provided in input

  const result = await query(
    `INSERT INTO proposals (lead_id, event_id, items, owner_user_id) VALUES ($1, $2, $3, $4) RETURNING *`,
    [lead_id, event_id, JSON.stringify(items), owner_user_id]
  );

  return result.rows[0];
}
