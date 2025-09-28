import axios from 'axios';

const XERO_TOKEN_URL = 'https://identity.xero.com/connect/token';
const XERO_API_URL = 'https://api.xero.com/api.xro/2.0';

export interface XeroTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  id_token: string;
  token_type: string;
  scope: string;
  tenant_id: string;
}

export async function getXeroTokens(code: string, redirectUri: string, clientId: string, clientSecret: string): Promise<XeroTokenResponse> {
  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', redirectUri);

  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await axios.post(XERO_TOKEN_URL, params, {
    headers: {
      'Authorization': `Basic ${authHeader}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  return response.data;
}

export async function refreshXeroTokens(refreshToken: string, clientId: string, clientSecret: string): Promise<XeroTokenResponse> {
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', refreshToken);

  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await axios.post(XERO_TOKEN_URL, params, {
    headers: {
      'Authorization': `Basic ${authHeader}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  return response.data;
}

export async function createXeroInvoice(accessToken: string, tenantId: string, invoiceData: any) {
  const response = await axios.post(`${XERO_API_URL}/Invoices`, invoiceData, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Xero-tenant-id': tenantId,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });
  return response.data;
}
