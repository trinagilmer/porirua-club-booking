import request from 'supertest';
import express from 'express';
import leadsRouter from '../src/modules/leads/leads.routes';

const app = express();
app.use(express.json());
app.use('/api', leadsRouter);

describe('POST /api/leads', () => {
  it('should create a new lead', async () => {
    const res = await request(app).post('/api/leads').send({
      name: 'Test Lead',
      email: 'test@example.com'
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('Test Lead');
  });
});

describe('GET /api/leads', () => {
  it('should return leads', async () => {
    const res = await request(app).get('/api/leads');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
