import request from 'supertest';
import express from 'express';
import calendarRouter from '../src/modules/calendar/calendar.routes';

const app = express();
app.use(express.json());
app.use('/api', calendarRouter);

describe('GET /api/calendar', () => {
  it('should return a list of calendar events', async () => {
    const res = await request(app).get('/api/calendar').query({ from: '2023-01-01', to: '2023-01-31' });
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should handle errors gracefully', async () => {
    // Temporarily override the service to throw an error
    jest.spyOn(require('../src/modules/calendar/calendar.service'), 'getCalendarEvents').mockImplementation(() => {
      throw new Error('Test error');
    });

    const res = await request(app).get('/api/calendar').query({ from: '2023-01-01', to: '2023-01-31' });
    expect(res.statusCode).toEqual(500);
    expect(res.body.error).toBe('Failed to fetch calendar events');
  });
});
