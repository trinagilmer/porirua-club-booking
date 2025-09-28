// backend/routes/calendar.js
const express = require('express');
const router = express.Router();
const { format, startOfWeek, endOfWeek } = require('date-fns');
const { getEventsBetween, generateDaysArray } = require('../models/events');

// GET /api/calendar/weekly  → JSON
router.get('/weekly', async (req, res) => {
  try {
    const startParam = req.query.start;
    const nav = req.query.nav;

    let startDate = startParam ? new Date(startParam) : new Date();
    if (nav === 'prev') startDate.setDate(startDate.getDate() - 7);
    if (nav === 'next') startDate.setDate(startDate.getDate() + 7);

    const weekStart = startOfWeek(startDate, { weekStartsOn: 1 });
    const weekEnd   = endOfWeek(startDate,   { weekStartsOn: 1 });

    const events = await getEventsBetween(weekStart, weekEnd);
    const days   = generateDaysArray(weekStart, weekEnd);

    return res.json({
      start: format(weekStart, 'yyyy-MM-dd'),
      end:   format(weekEnd,   'yyyy-MM-dd'),
      days,
      events
    });
  } catch (err) {
    console.error('Calendar weekly API error:', err);
    return res.status(500).json({ error: 'Failed to load weekly calendar' });
  }
});

module.exports = router;
