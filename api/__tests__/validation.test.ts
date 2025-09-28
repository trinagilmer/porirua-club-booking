import request from 'supertest';
import express from 'express';
import { z } from 'zod';
import { validateRequest } from '../src/middleware/zodMiddleware';

const app = express();
app.use(express.json());

const schema = z.object({
  body: z.object({
    name: z.string(),
    age: z.number().min(0),
  }),
});

app.post('/test', validateRequest(schema), (req, res) => {
  res.json({ message: 'Valid request' });
});

describe('Request validation middleware', () => {
  it('should accept valid request', async () => {
    const res = await request(app).post('/test').send({ name: 'John', age: 30 });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Valid request');
  });

  it('should reject invalid request', async () => {
    const res = await request(app).post('/test').send({ name: 'John', age: -1 });
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });
});
