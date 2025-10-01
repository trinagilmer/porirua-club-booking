const express = require('express');
const router = express.Router();
const pool = require('../db');

/**
 * GET /staff/bookings
 * Show enquiries + functions (pending/cancelled) in staff view
 */
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      WITH fn AS (
        SELECT
          'function' AS stage,
          f.id AS function_id,
          f.status AS function_status,
          (f.event_date::timestamp + COALESCE(f.event_time,'00:00'::time)) AS event_at,
          b.id AS booking_id,
          b.name, b.email, b.phone, b.guests
        FROM functions f
        JOIN bookings b ON b.id = f.booking_id
        WHERE f.status IN ('pending','cancelled')
      ),
      enqu AS (
        SELECT
          'enquiry' AS stage,
          NULL AS function_id,
          NULL AS function_status,
          b.datetime AS event_at,
          b.id AS booking_id,
          b.name, b.email, b.phone, b.guests
        FROM bookings b
        WHERE b.type='function'
          AND b.status IN ('pending','cancelled')
          AND NOT EXISTS (SELECT 1 FROM functions f WHERE f.booking_id=b.id)
      )
      SELECT * FROM fn
      UNION ALL
      SELECT * FROM enqu
      ORDER BY event_at ASC NULLS LAST, booking_id ASC
    `);

    res.render('Pages/staffBookings', {
      bookings: rows,
      user: req.session.user
    });
  } catch (err) {
    console.error('Error fetching staff bookings:', err);
    res.status(500).send('Failed to load bookings');
  }
});

/**
 * GET /staff/bookings/:id
 * Detail page for a single booking
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(`
      SELECT b.*, f.id AS function_id, f.status AS function_status
      FROM bookings b
      LEFT JOIN functions f ON f.booking_id = b.id
      WHERE b.id=$1
    `, [id]);

    if (!rows[0]) return res.status(404).send('Booking not found');
    res.render('Pages/staffBookingDetail', {
      booking: rows[0],
      user: req.session.user
    });
  } catch (err) {
    console.error('Error fetching booking detail:', err);
    res.status(500).send('Failed to load booking detail');
  }
});

module.exports = router;

