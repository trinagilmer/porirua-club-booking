import { query } from '../../db';

export async function logProposalEmail(proposalId: string, emailData: any) {
  // Log email to emails table
  await query(
    `INSERT INTO emails (proposal_id, email_data, sent_at) VALUES ($1, $2, NOW())`,
    [proposalId, JSON.stringify(emailData)]
  );

  // Update last_sent_at on proposals
  await query(
    `UPDATE proposals SET last_sent_at = NOW() WHERE id = $1`,
    [proposalId]
  );
}
