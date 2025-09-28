import request from 'supertest';
import express from 'express';
import proposalsRouter from '../src/modules/proposals/proposals.routes';

const app = express();
app.use(express.json());
app.use('/api', proposalsRouter);

describe('POST /api/proposals', () => {
  it('should create a new proposal', async () => {
    const res = await request(app).post('/api/proposals').send({
      items: [
        {
          item_type: 'room_hire',
          item_id: 'item1',
          name_snapshot: 'Room Hire',
          price_snapshot: 100,
          quantity: 1
        }
      ]
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
  });
});
