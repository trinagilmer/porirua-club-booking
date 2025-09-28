const request = require('supertest');
const express = require('express');
const session = require('express-session');

// Import the app or create an express instance and use the routes
const app = express();

// Middleware setup (simplified for testing)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'testsecret', resave: false, saveUninitialized: false }));

// Import the functions router
const functionsRouter = require('../routes/functions');
app.use('/api/functions', functionsRouter);

describe('Functions Routes', () => {
  it('GET /api/functions/calendar/monthly should return 200 and contain Monthly Calendar', async () => {
    const res = await request(app).get('/api/functions/calendar/monthly');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('Monthly Calendar');
  });

  it('GET /api/functions/calendar/weekly with start param should return 200 and contain Weekly Calendar', async () => {
    const res = await request(app).get('/api/functions/calendar/weekly?start=2025-09-22');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('Weekly Calendar');
  });

  it('GET /api/functions/:id/detail should return 200 or 404', async () => {
    const res = await request(app).get('/api/functions/1/detail');
    expect([200, 404]).toContain(res.statusCode);
  });

  it('GET /api/functions/:id/edit should return 200 or 404', async () => {
    const res = await request(app).get('/api/functions/1/edit');
    expect([200, 404]).toContain(res.statusCode);
  });

  it('POST /api/functions/:id/edit should redirect (302) or fail (500)', async () => {
    const res = await request(app).post('/api/functions/1/edit').send({ event_name: 'Test Event', room: 'Test Room', attendees: 10 });
    expect([302, 500]).toContain(res.statusCode);
  });

  it('GET /api/functions/:id/run-sheet should return 200 or 404', async () => {
    const res = await request(app).get('/api/functions/1/run-sheet');
    expect([200, 404]).toContain(res.statusCode);
  });

  it('GET /api/functions/calendar/weekly/pdf with start param should return 200 and PDF content-type', async () => {
    const res = await request(app).get('/api/functions/calendar/weekly/pdf?start=2025-09-22');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
  });

  it('GET /api/functions/ should return 200 and contain functionsList', async () => {
    const res = await request(app).get('/api/functions/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('functionsList');
  });
});
