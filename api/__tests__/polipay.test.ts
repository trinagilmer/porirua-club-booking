import request from 'supertest';
import express from 'express';
import polipayRouter from '../src/modules/payments/polipay.routes';
import polipayWebhookRouter from '../src/modules/webhooks/polipay.routes';

const app = express();
app.use(express.json());
app.use('/api', polipayRouter);
app.use('/api', polipayWebhookRouter);

describe('POST /api/payments/polipay/session', () => {
  it('should create a PoliPay redirect session', async () => {
    const res = await request(app).post('/api/payments/polipay/session').send({ proposalId: 'proposal1' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('url');
  });
});

describe('POST /api/webhooks/polipay', () => {
  it('should reject webhook with invalid signature', async () => {
    const res = await request(app).post('/api/webhooks/polipay').set('x-polipay-signature', 'invalid').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Invalid signature');
  });

  // Additional tests for valid signature and idempotency can be added here
});
