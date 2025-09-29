const express = require('express');
const router = express.Router();
const pool = require('../db');

const { parse } = require('date-fns');
const { zonedTimeToUtc, utcToZonedTime, format: tzFormat } = require('date-fns-tz');

const NZ_TZ = 'Pacific/Auckland';
const STATUS_ALLOWED = ['pending', 'confirmed', 'cancelled'];

/**
 * Helper: safely format a UTC timestamp to NZ local (nice string for UI).
 */
function toNzDisplay(ts) {
  if (!ts) return null;
  const nz = utcToZonedTime(ts, NZ_TZ);
  return tzFormat(nz, "dd MMM yyyy, h:mm a", { timeZone: NZ_TZ });
}

/**
 * GET /api/bookings
 * Unchanged semantics: all bookings, ordered by datetime (NULLS LAST), id ASC.
 */
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM bookings ORDER BY datetime ASC NULLS LAST, id ASC'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching bookings:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

/**
 * NEW: GET /api/bookings/functions-pipeline?status=pending|confirmed|cancelled|all
 * Returns BOTH:
 *  - Stage "function": functions that exist (usually pending/confirmed)
 *  - Stage "enquiry": bookings of type 'function' with no function created yet
 * So your Bookings (Function Enquiries) page can show everything consistently.
 */
router.get('/functions-pipeline', async (req, res, next) => {
  try {
    const status = (req.query.status || 'pending').toLowerCase();
    if (status !== 'all' && !STATUS_ALLOWED.includes(status)) {
      return res.status(400).json({ error: "Invalid status. Use 'pending' | 'confirmed' | 'cancelled' | 'all'." });
    }

    // Build parameterized SQL with optional status filters
    const params = [];
    let i = 1;

    const fnStatusFilter =
      status === 'all' ? '' : `WHERE f.status = $${i++}`;
    if (status !== 'all') params.push(status);

    const bkStatusFilter =
      status === 'all'
        ? `b.status IN ('pending','confirmed','cancelled')`
        : `b.status = $${i++}`;

    if (status !== 'all') params.push(status);

    const sql = `
      SELECT *
      FROM (
        -- Functions that already exist (e.g., pending on dashboard)
        SELECT
          'function'                                AS stage,
          b.id                                       AS booking_id,
          f.id                                       AS function_id,
          b.name,
          b.email,
          b.phone,
          COALESCE(f.guest_count, b.guests)          AS pax,
          COALESCE(f.start_at, f.datetime, b.datetime) AS event_at,
          f.status                                   AS status
        FROM functions f
        JOIN bookings b ON b.id = f.booking_id
        ${fnStatusFilter}

        UNION ALL

        -- Enquiries: bookings (type=function) with no function record yet
        SELECT
          'enquiry'                                  AS stage,
          b.id                                       AS booking_id,
          NULL                                       AS function_id,
          b.name,
          b.email,
          b.phone,
          b.guests                                   AS pax,
          b.datetime                                 AS event_at,
          b.status                                   AS status
        FROM bookings b
        WHERE b.type = 'function'
          AND ${bkStatusFilter}
          AND NOT EXISTS (
            SELECT 1 FROM functions f WHERE f.booking_id = b.id
          )
      ) q
      ORDER BY q.event_at ASC NULLS LAST, q.booking_id ASC
    `;

    const { rows } = await pool.query(sql, params);

    // Add a handy local-time display without breaking existing keys
    const payload = rows.map(r => ({
      ...r,
      event_at_local: r.event_at ? toNzDisplay(r.event_at) : null,
    }));

    res.json(payload);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/bookings
 * Body: { name, email, phone?, type, guests?, datetime } where datetime is "dd/MM/yyyy HH:mm" in NZ local.
 * Stores as UTC in timestamptz.
 */
router.post('/', async (req, res) => {
  const { name, email, phone, type, guests, datetime } = req.body;

  if (!name || !email || !type || !datetime) {
    return res.status(400).json({ error: 'Missing required fields (name, email, type, datetime)' });
  }

  // Parse dd/MM/yyyy HH:mm as NZ local
  const local = parse(String(datetime), 'dd/MM/yyyy HH:mm', new Date());
  if (Number.isNaN(local.getTime())) {
    return res.status(400).json({ error: 'Invalid datetime format. Use dd/MM/yyyy HH:mm' });
  }

  // Convert to UTC for timestamptz
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
    console.error('Error inserting booking:', err);
    res.status(500).json({ error: 'Database insert failed' });
  }
});

/**
 * (Optional, handy) GET /api/bookings/:id
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query('SELECT * FROM bookings WHERE id=$1', [id]);
    if (!rows[0]) return res.status(404).json({ error: 'Booking not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Fetch booking error:', err);
    res.status(500).json({ error: 'Failed to fetch booking' });
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


