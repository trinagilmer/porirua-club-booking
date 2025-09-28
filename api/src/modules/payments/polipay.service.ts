import crypto from 'crypto';
import { verifyPoliPaySignature } from './polipay.adapter';
import { query } from '../../db';

const POLIPAY_WEBHOOK_SECRET = process.env.POLIPAY_WEBHOOK_SECRET || '';

export async function createPoliPaySession(proposalId: string): Promise<{ url: string }> {
  // Placeholder implementation for PoliPay session creation
  // In real implementation, call PoliPay API with proposal/payment details

  // Generate a dummy redirect URL
  const sessionId = crypto.randomBytes(16).toString('hex');
  const redirectUrl = `https://sandbox.polipay.com/redirect/${sessionId}`;

  return { url: redirectUrl };
}

export function verifyPoliPaySignatureWrapper(signature: string, payload: string): boolean {
  return verifyPoliPaySignature(signature, payload);
}

export async function upsertPayment(payload: any) {
  // Idempotent upsert to payments table
  const { payment_id, status, proposal_id, amount } = payload;
  await query(
    `INSERT INTO payments (id, status, proposal_id, amount) VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status`,
    [payment_id, status, proposal_id, amount]
  );
}

export async function updateProposalEventStatus(payload: any) {
  if (payload.status === 'succeeded') {
    // Example: update proposal and event status
    await query(`UPDATE proposals SET status = 'accepted' WHERE id = $1`, [payload.proposal_id]);
    await query(
      `UPDATE functions SET status = 'confirmed' WHERE id = (SELECT event_id FROM proposals WHERE id = $1)`,
      [payload.proposal_id]
    );
  }
}
