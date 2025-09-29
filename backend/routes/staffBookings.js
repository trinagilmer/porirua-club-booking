const express = require('express');
const router = express.Router();
const pool = require('../db');

/**
 * GET /staff/bookings
 * Shows a unified list:
 *  - stage='function'  → rows from functions (status IN pending,cancelled)
 *  - stage='enquiry'   → bookings.type='function' with no function yet (status IN pending,cancelled)
 * Ordered by the best available datetime.
 */
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
WITH fn AS (
  SELECT
    'function'::text AS stage,
    f.id::int        AS function_id,
    f.status::text   AS function_status,
    (f.event_date::timestamp + COALESCE(f.event_time,'00:00'::time))::timestamptz AS function_datetime,
    b.id::int        AS booking_id,
    b.status::text   AS booking_status,
    b.datetime::timestamptz AS booking_datetime,
    b.name::text     AS name,
    b.email::text    AS email,
    b.phone::text    AS phone,
    b.type::text     AS type,
    b.guests::int    AS guests
  FROM functions f
  LEFT JOIN bookings b ON b.id = f.booking_id
  WHERE f.status IN ('pending','cancelled')
),
enqu AS (
  SELECT
    'enquiry'::text  AS stage,
    NULL::int        AS function_id,
    NULL::text       AS function_status,
    NULL::timestamptz AS function_datetime,
    b.id::int        AS booking_id,
    b.status::text   AS booking_status,
    b.datetime::timestamptz AS booking_datetime,
    b.name::text     AS name,
    b.email::text    AS email,
    b.phone::text    AS phone,
    b.type::text     AS type,
    b.guests::int    AS guests
  FROM bookings b
  WHERE b.type = 'function'
    AND b.status IN ('pending','cancelled')
    AND NOT EXISTS (SELECT 1 FROM functions f WHERE f.booking_id = b.id)
)
SELECT * FROM fn
UNION ALL
SELECT * FROM enqu
ORDER BY COALESCE(function_datetime, booking_datetime) ASC NULLS LAST,
         booking_id ASC;


    // Render your existing EJS (capitalised path matches app.js)
    res.render('pages/staffBookings', {
      bookings: rows,
      user: req.session.user
    });
  } catch (err) {
    console.error('Error fetching staff bookings:', err);
    res.status(500).send('Failed to load bookings');
  }
});

module.exports = router;


