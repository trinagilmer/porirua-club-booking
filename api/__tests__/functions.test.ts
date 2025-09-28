import request from 'supertest';
import app from '../../backend/app';

describe('Functions API', () => {
  // Test GET /api/functions/:id/detail
  it('should fetch function detail by id', async () => {
    const res = await request(app).get('/api/functions/1/detail');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('functionDetail');
  });

  // Test GET /api/functions/:id/edit
  it('should fetch edit form for function by id', async () => {
    const res = await request(app).get('/api/functions/1/edit');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('editFunction');
  });

  // Test POST /api/functions/:id/edit
  it('should update function data', async () => {
    const res = await request(app)
      .post('/api/functions/1/edit')
      .send({ event_name: 'Updated Event', room: 'Room 1', attendees: 10 });
    expect(res.statusCode).toBe(302); // Redirect after successful update
  });

  // Test GET /api/functions/:id/run-sheet
  it('should fetch run sheet in JSON', async () => {
    const res = await request(app).get('/api/functions/1/run-sheet');
    expect(res.statusCode).toBe(200);
    expect(res.body).toBeDefined();
  });

  // Test GET /api/functions/calendar/monthly
  it('should fetch monthly calendar', async () => {
    const res = await request(app).get('/api/functions/calendar/monthly');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('Monthly Calendar');
  });

  // Test GET /api/functions/calendar/weekly
  it('should fetch weekly calendar with start param', async () => {
    const res = await request(app).get('/api/functions/calendar/weekly?start=2025-09-22');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('Weekly Calendar');
  });

  // Test GET /api/functions/calendar/weekly/pdf
  it('should fetch weekly calendar PDF with start param', async () => {
    const res = await request(app).get('/api/functions/calendar/weekly/pdf?start=2025-09-22');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
  });

  // Test GET /api/functions/
  it('should fetch functions list', async () => {
    const res = await request(app).get('/api/functions/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('functionsList');
  });
});
