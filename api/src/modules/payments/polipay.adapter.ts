import crypto from 'crypto';

const POLIPAY_WEBHOOK_SECRET = process.env.POLIPAY_WEBHOOK_SECRET || '';

export function verifyPoliPaySignature(signature: string, payload: string): boolean {
  const hmac = crypto.createHmac('sha256', POLIPAY_WEBHOOK_SECRET);
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');
  return signature === expectedSignature;
}
