import request from 'supertest';
import express from 'express';
import xeroRouter from '../src/modules/invoices/xero.routes';

const app = express();
app.use(express.json());
app.use('/api', xeroRouter);

describe('POST /api/invoices/xero', () => {
  it('should create/send a Xero invoice', async () => {
    const res = await request(app).post('/api/invoices/xero').send({
      proposal_id: 'proposal1',
      tenant_id: 'tenant1'
    });
    expect(res.statusCode).toBe(200);
  });
});
