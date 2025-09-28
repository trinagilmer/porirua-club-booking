import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import { handlePoliPayWebhook } from '../src/modules/webhooks/polipay.controller';

const app = express();
app.use(bodyParser.json());
app.post('/api/webhooks/polipay', handlePoliPayWebhook);

describe('PoliPay webhook handler', () => {
  it('should reject invalid signature', async () => {
    const res = await request(app)
      .post('/api/webhooks/polipay')
      .set('x-polipay-signature', 'invalid')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid signature');
  });

  it('should process webhook with valid signature', async () => {
    // Mock verifyPoliPaySignature to always return true
    jest.mock('../src/modules/webhooks/polipay.service', () => ({
      verifyPoliPaySignature: jest.fn(() => true),
      upsertPayment: jest.fn(() => Promise.resolve()),
      updateProposalEventStatus: jest.fn(() => Promise.resolve()),
    }));

    const res = await request(app)
      .post('/api/webhooks/polipay')
      .set('x-polipay-signature', 'valid')
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Webhook processed');
  });
});
