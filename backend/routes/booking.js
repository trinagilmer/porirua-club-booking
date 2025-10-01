const express = require('express');
const router = express.Router();
const pool = require('../db');
const { parse } = require('date-fns');
const { zonedTimeToUtc, utcToZonedTime, format: tzFormat } = require('date-fns-tz');

const NZ_TZ = 'Pacific/Auckland';
const STATUS_ALLOWED = ['pending', 'confirmed', 'cancelled'];

function toNzDisplay(ts) {
  if (!ts) return null;
  const nz = utcToZonedTime(ts, NZ_TZ);
  return tzFormat(nz, "dd MMM yyyy, h:mm a", { timeZone: NZ_TZ });
}

/**
 * GET /api/bookings/functions-pipeline
 * Returns enquiries + functions, optional ?status=all|pending|confirmed|cancelled
 */
router.get('/functions-pipeline', async (req, res) => {
  try {
    const status = (req.query.status || 'all').toLowerCase();
    if (status !== 'all' && !STATUS_ALLOWED.includes(status)) {
      return res.status(400).json({ error: 'Invalid status filter' });
    }

    const params = [];
    let fnFilter = '';
    let bkFilter = `b.status IN ('pending','confirmed','cancelled')`;

    if (status !== 'all') {
      params.push(status);
      fnFilter = `WHERE f.status = $1`;
      bkFilter = `b.status = $1`;
    }

    const sql = `
      SELECT *
      FROM (
        -- Existing functions
        SELECT
          'function' AS stage,
          b.id AS booking_id,
          f.id AS function_id,
          b.name, b.email, b.phone,
          COALESCE(f.guest_count, b.guests) AS pax,
          COALESCE(f.start_at, b.datetime) AS event_at,
          f.status AS status
        FROM functions f
        JOIN bookings b ON b.id = f.booking_id
        ${fnFilter}

        UNION ALL

        -- Enquiries with no function yet
        SELECT
          'enquiry' AS stage,
          b.id AS booking_id,
          NULL AS function_id,
          b.name, b.email, b.phone,
          b.guests AS pax,
          b.datetime AS event_at,
          b.status AS status
        FROM bookings b
        WHERE b.type = 'function'
          AND ${bkFilter}
          AND NOT EXISTS (SELECT 1 FROM functions f WHERE f.booking_id = b.id)
      ) q
      ORDER BY q.event_at ASC NULLS LAST, q.booking_id ASC
    `;

    const { rows } = await pool.query(sql, params);
    const payload = rows.map(r => ({
      ...r,
      event_at_local: r.event_at ? toNzDisplay(r.event_at) : null
    }));
    res.json(payload);
  } catch (err) {
    console.error('functions-pipeline error:', err);
    res.status(500).json({ error: 'Failed to fetch pipeline' });
  }
});

/**
 * POST /api/bookings
 * Accepts { name, email, phone, type, guests, datetime } in NZ local dd/MM/yyyy HH:mm
 */
router.post('/', async (req, res) => {
  const { name, email, phone, type, guests, datetime } = req.body;
  if (!name || !email || !type || !datetime) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const local = parse(String(datetime), 'dd/MM/yyyy HH:mm', new Date());
  if (Number.isNaN(local.getTime())) {
    return res.status(400).json({ error: 'Invalid datetime format (use dd/MM/yyyy HH:mm)' });
  }

  const asUtc = zonedTimeToUtc(local, NZ_TZ);

  try {
    const { rows } = await pool.query(
      `INSERT INTO bookings (name, email, phone, type, guests, datetime, status)
       VALUES ($1,$2,$3,$4,$5,$6,'pending') RETURNING *`,
      [name, email, phone ?? null, type, guests ?? null, asUtc]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error inserting booking:', err);
    res.status(500).json({ error: 'Database insert failed' });
  }
});

/**
 * PATCH /api/bookings/:id/status
 */
router.patch('/:id/status', async (req, res) => {
  const { id } = req.params;
  const status = (req.body.status || '').toLowerCase();
  if (!STATUS_ALLOWED.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  try {
    const { rows } = await pool.query(
      `UPDATE bookings SET status=$1 WHERE id=$2 RETURNING *`,
      [status, id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Booking not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Update booking status error:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

module.exports = router;



