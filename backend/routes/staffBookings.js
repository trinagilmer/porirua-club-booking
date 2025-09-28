const express = require('express');
const router = express.Router();
const pool = require('../db');

// Staff bookings list page
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, f.id AS function_id
         FROM bookings b
         LEFT JOIN functions f ON f.booking_id = b.id
       ORDER BY b.datetime ASC NULLS LAST, b.id ASC`
    );

    // Render the richer page: views/pages/staffBookings.ejs
    res.render('pages/staffBookings', {
      bookings: result.rows,
      user: req.session.user
    });
  } catch (err) {
    console.error('Error fetching staff bookings:', err.message);
    res.status(500).send('Failed to load bookings');
  }
});

module.exports = router;

