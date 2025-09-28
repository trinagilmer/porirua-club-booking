import { query } from '../../db';
import { getXeroTokens, refreshXeroTokens, createXeroInvoice } from './xero.adapter';

export async function storeXeroTokens(data: any) {
  const { access_token, refresh_token, expires_in, id_token, token_type, scope, tenant_id } = data;
  // Store tokens and tenant_id in a secure table
  await query(
    `INSERT INTO xero_tokens (access_token, refresh_token, expires_in, id_token, token_type, scope, tenant_id, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     ON CONFLICT (tenant_id) DO UPDATE SET access_token = EXCLUDED.access_token, refresh_token = EXCLUDED.refresh_token, expires_in = EXCLUDED.expires_in, id_token = EXCLUDED.id_token, token_type = EXCLUDED.token_type, scope = EXCLUDED.scope, created_at = NOW()`,
    [access_token, refresh_token, expires_in, id_token, token_type, scope, tenant_id]
  );
  return tenant_id;
}

export async function getStoredXeroToken(tenantId: string) {
  const result = await query(`SELECT * FROM xero_tokens WHERE tenant_id = $1`, [tenantId]);
  return result.rows[0];
}

export async function handleXeroOAuthCallback(code: string, redirectUri: string, clientId: string, clientSecret: string) {
  const tokenData = await getXeroTokens(code, redirectUri, clientId, clientSecret);
  return storeXeroTokens(tokenData);
}

export async function createInvoiceForProposal(proposalId: string, tenantId: string) {
  // Fetch proposal data and map to Xero invoice format
  // Placeholder
  const invoiceData = {
    Type: 'ACCREC',
    Contact: { Name: 'Sample Contact' },
    Date: new Date().toISOString().split('T')[0],
    DueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    LineItems: [
      {
        Description: 'Sample Item',
        Quantity: 1,
        UnitAmount: 100
      }
    ],
    Status: 'AUTHORISED'
  };

  // Get access token
  // TODO: refresh token if expired
  const accessToken = (await getStoredXeroToken(tenantId)).access_token;

  const response = await createXeroInvoice(accessToken, tenantId, { Invoices: [invoiceData] });

  // Persist xero_invoice_id
  await query(
    `UPDATE proposals SET xero_invoice_id = $1 WHERE id = $2`,
    [response.Invoices[0].InvoiceID, proposalId]
  );

  return response;
}
