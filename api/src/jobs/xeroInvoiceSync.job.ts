import { query } from '../db';
import axios from 'axios';

export async function syncXeroInvoicePayments() {
  // Fetch all invoices with status not paid
  const result = await query(`SELECT id, xero_invoice_id, tenant_id FROM proposals WHERE status != 'paid' AND xero_invoice_id IS NOT NULL`);

  for (const row of result.rows) {
    const { id, xero_invoice_id, tenant_id } = row;

    // Fetch invoice status from Xero API
    try {
      const tokenResult = await query(`SELECT access_token FROM xero_tokens WHERE tenant_id = $1`, [tenant_id]);
      if (tokenResult.rows.length === 0) continue;
      const accessToken = tokenResult.rows[0].access_token;

      const response = await axios.get(`https://api.xero.com/api.xro/2.0/Invoices/${xero_invoice_id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Xero-tenant-id': tenant_id
        }
      });

      const invoice = response.data.Invoices[0];

      if (invoice.Status === 'PAID') {
        await query(`UPDATE proposals SET status = 'paid' WHERE id = $1`, [id]);
      }
    } catch (error) {
      console.error(`Failed to sync invoice ${xero_invoice_id}:`, error);
    }
  }
}
