const express = require('express');
const router = express.Router();
const pool = require('../db');

const { parse } = require('date-fns');
const { zonedTimeToUtc, utcToZonedTime, format: tzFormat } = require('date-fns-tz');
const NZ_TZ = 'Pacific/Auckland';

// GET /api/bookings
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM bookings ORDER BY datetime ASC NULLS LAST, id ASC'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching bookings:', err.message);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// POST /api/bookings  (expects datetime like "15/11/2025 18:00")
router.post('/', async (req, res) => {
  const { name, email, phone, type, guests, datetime } = req.body;

  if (!name || !email || !type || !datetime) {
    return res.status(400).json({ error: 'Missing required fields (name, email, type, datetime)' });
  }

  // Parse dd/MM/yyyy HH:mm as **NZ local**
  const local = parse(String(datetime), 'dd/MM/yyyy HH:mm', new Date());
  if (isNaN(local)) return res.status(400).json({ error: 'Invalid datetime format. Use dd/MM/yyyy HH:mm' });

  // Convert to UTC for storage in timestamptz
  const asUtc = zonedTimeToUtc(local, NZ_TZ);

  try {
    const { rows } = await pool.query(
      `INSERT INTO bookings (name, email, phone, type, guests, datetime, status)
       VALUES ($1,$2,$3,$4,$5,$6,'pending')
       RETURNING *`,
      [name, email, phone ?? null, type, guests ?? null, asUtc]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error inserting booking:', err.message);
    res.status(500).json({ error: 'Database insert failed' });
  }
});

// PATCH /api/bookings/:id/status (unchanged)
router.patch('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const allowed = ['pending','confirmed','cancelled'];
  if (!allowed.includes((status || '').toLowerCase())) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  try {
    const { rows } = await pool.query(
      `UPDATE bookings SET status=$1 WHERE id=$2 RETURNING *`,
      [status.toLowerCase(), id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Booking not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Update booking status error:', err.message);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

module.exports = router;

