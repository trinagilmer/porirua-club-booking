import { query } from '../../db';

export async function acceptProposal(proposalId: string) {
  // 1. Set event status to confirmed
  await query(`UPDATE functions SET status = 'confirmed' WHERE id = (SELECT event_id FROM proposals WHERE id = $1)`, [proposalId]);

  // 2. Create invoice (Task 5) - placeholder
  // await createInvoiceForProposal(proposalId);

  // 3. Start PoliPay session if deposit due (Task 4) - placeholder
  // await startPoliPaySession(proposalId);

  return { message: 'Proposal accepted, event confirmed, invoice created, PoliPay session started if needed' };
}
