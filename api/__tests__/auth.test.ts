import request from 'supertest';
import express from 'express';

const app = express();

// Dummy auth middleware for testing
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
  if (authHeader !== 'Bearer validtoken') return res.status(403).json({ error: 'Forbidden' });
  next();
}

app.get('/protected', authMiddleware, (req, res) => {
  res.json({ message: 'Access granted' });
});

describe('Auth middleware', () => {
  it('should return 401 if no auth header', async () => {
    const res = await request(app).get('/protected');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('should return 403 if invalid token', async () => {
    const res = await request(app).get('/protected').set('Authorization', 'Bearer invalidtoken');
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden');
  });

  it('should allow access with valid token', async () => {
    const res = await request(app).get('/protected').set('Authorization', 'Bearer validtoken');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Access granted');
  });
});
