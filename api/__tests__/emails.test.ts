import request from 'supertest';
import express from 'express';
import emailsRouter from '../src/modules/emails/emails.routes';

const app = express();
app.use(express.json());
app.use('/api', emailsRouter);

describe('POST /api/emails/send', () => {
  it('should send and log an email', async () => {
    const response = await request(app)
      .post('/api/emails/send')
      .send({
        to: 'test@example.com',
        subject: 'Test Email',
        templateName: 'proposal_sent',
        variables: {
          client_name: 'John Doe',
          event_title: 'Annual Gala',
          event_date: '2024-07-01',
          room_name: 'Main Hall',
          pax: 100,
          deposit_due: '$500',
          balance_due: '$1000',
          polipay_link: 'http://pay.link',
          xero_invoice_number: 'INV12345'
        }
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('to', 'test@example.com');
    expect(response.body).toHaveProperty('subject', 'Test Email');
    expect(response.body.body).toContain('John Doe');
    expect(response.body.body).toContain('Annual Gala');
  });

  it('should fail with missing fields', async () => {
    const response = await request(app)
      .post('/api/emails/send')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
});
