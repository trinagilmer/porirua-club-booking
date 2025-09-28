import { query } from '../db';

export async function reconcilePoliPayPayments() {
  // Find payments with pending status older than a threshold
  const result = await query(`SELECT id FROM payments WHERE status = 'pending' AND created_at < NOW() - INTERVAL '1 hour'`);

  for (const row of result.rows) {
    const paymentId = row.id;
    // TODO: Call PoliPay API to get latest status for paymentId
    // For now, just log
    console.log(`Reconciling payment ${paymentId}`);

    // TODO: Update payment status accordingly
  }
}
