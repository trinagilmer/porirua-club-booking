// backend/routes/staffCalendar.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

const {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  addDays, addMonths, format, parseISO, startOfDay, isSameDay
} = require('date-fns');

// Redirect root → weekly
router.get('/', (_req, res) => res.redirect('/staff/calendar/weekly'));

/* =========================
   Weekly Calendar (NZ day)
   ========================= */
router.get('/weekly', async (req, res) => {
  try {
    const monthStartParam = req.query.start; // yyyy-MM-dd (optional)
    const start = monthStartParam ? parseISO(monthStartParam) : new Date();
    const weekStart = startOfWeek(start, { weekStartsOn: 1 });
    const weekEnd   = endOfWeek(start,   { weekStartsOn: 1 });

    const NZ_TZ = 'Pacific/Auckland';
    const d1 = format(weekStart, 'yyyy-MM-dd');
    const d2 = format(weekEnd,   'yyyy-MM-dd');

    // FUNCTIONS bucketed to NZ local date
    const { rows: fnRows } = await pool.query(
      `
      SELECT
        f.id,
        f.event_name,
        f.room,
        f.attendees,
        /* NZ local day bucket */
        COALESCE(
          f.event_date::date,
          (f.created_at AT TIME ZONE $3)::date
        ) AS nz_day,
        COALESCE(f.event_time, '00:00'::time) AS nz_time,
        b.name  AS contact_name,
        b.phone AS contact_phone
      FROM functions f
      LEFT JOIN bookings b ON b.id = f.booking_id
      WHERE COALESCE(
              f.event_date::date,
              (f.created_at AT TIME ZONE $3)::date
            ) BETWEEN $1::date AND $2::date
      ORDER BY nz_day ASC, nz_time ASC, f.id ASC
      `,
      [d1, d2, NZ_TZ]
    );

    // BOOKINGS bucketed to NZ local date
    const { rows: bkRows } = await pool.query(
      `
      SELECT
        id,
        name,
        type,
        guests,
        status,
        (datetime AT TIME ZONE $3)::date AS nz_day,
        (datetime AT TIME ZONE $3)::time AS nz_time
      FROM bookings
      WHERE (datetime AT TIME ZONE $3)::date BETWEEN $1::date AND $2::date
      ORDER BY nz_day ASC, nz_time ASC, id ASC
      `,
      [d1, d2, NZ_TZ]
    );

    // Build map: yyyy-MM-dd -> items[]
    const eventsByDate = {};
    const toKey = v => (typeof v === 'string' ? v : format(new Date(v), 'yyyy-MM-dd'));

    fnRows.forEach(r => {
      const key = toKey(r.nz_day);
      if (!eventsByDate[key]) eventsByDate[key] = [];
      eventsByDate[key].push({
        evtype: 'function',
        id: r.id,
        event_name: r.event_name,
        room: r.room,
        attendees: r.attendees,
        contact_name: r.contact_name,
        contact_phone: r.contact_phone
      });
    });

    bkRows.forEach(b => {
      const key = toKey(b.nz_day);
      if (!eventsByDate[key]) eventsByDate[key] = [];
      eventsByDate[key].push({
        evtype: 'booking',
        id: b.id,
        name: b.name,
        type: b.type,
        guests: b.guests,
        status: (b.status || '').toLowerCase()
      });
    });

    // Build day headers Mon..Sun
    const today = startOfDay(new Date());
    const days = [];
    for (let d = weekStart; d <= weekEnd; d = addDays(d, 1)) {
      const key = format(d, 'yyyy-MM-dd');
      days.push({
        dateKey: key,
        dateStr: format(d, 'EEE d'),
        isToday: isSameDay(d, today),
        isPast: d < today
      });
    }

   return res.render('pages/calendarWeekly', {
      days,
      events: eventsByDate,
      start: format(weekStart, 'yyyy-MM-dd'),
      end:   format(weekEnd,   'yyyy-MM-dd')
    });
  } catch (err) {
    console.error('Weekly calendar error:', err);
    return res.status(500).send('Failed to load weekly calendar');
  }
});

/* =========================
   Monthly Calendar (NZ day)
   ========================= */
router.get('/monthly', async (req, res) => {
  try {
    const monthParam   = req.query.month || format(new Date(), 'yyyy-MM'); // e.g. "2025-11"
    const firstOfMonth = parseISO(monthParam + '-01');

    // Full-week grid covering the month (Mon..Sun)
    const gridStart = startOfWeek(startOfMonth(firstOfMonth), { weekStartsOn: 1 });
    const gridEnd   = endOfWeek(endOfMonth(firstOfMonth),     { weekStartsOn: 1 });

    const NZ_TZ = 'Pacific/Auckland';
    const d1 = format(gridStart, 'yyyy-MM-dd');
    const d2 = format(gridEnd,   'yyyy-MM-dd');

    // FUNCTIONS → NZ day
    const { rows: fnRows } = await pool.query(
      `
      SELECT
        f.id,
        f.event_name,
        f.room,
        f.attendees,
        COALESCE(
          f.event_date::date,
          (f.created_at AT TIME ZONE $3)::date
        ) AS nz_day
      FROM functions f
      WHERE COALESCE(
              f.event_date::date,
              (f.created_at AT TIME ZONE $3)::date
            ) BETWEEN $1::date AND $2::date
      ORDER BY nz_day ASC, f.id ASC
      `,
      [d1, d2, NZ_TZ]
    );

    // BOOKINGS → NZ day
    const { rows: bkRows } = await pool.query(
      `
      SELECT
        id,
        name,
        type,
        guests,
        status,
        (datetime AT TIME ZONE $3)::date AS nz_day
      FROM bookings
      WHERE (datetime AT TIME ZONE $3)::date BETWEEN $1::date AND $2::date
      ORDER BY nz_day ASC, id ASC
      `,
      [d1, d2, NZ_TZ]
    );

    // Map: yyyy-MM-dd → items[]
    const byDay = {};
    const toKey = v => (typeof v === 'string' ? v : format(new Date(v), 'yyyy-MM-dd'));

    fnRows.forEach(r => {
      const key = toKey(r.nz_day);
      if (!byDay[key]) byDay[key] = [];
      byDay[key].push({
        evtype: 'function',
        id: r.id,
        event_name: r.event_name,
        room: r.room,
        attendees: r.attendees
      });
    });

    bkRows.forEach(b => {
      const key = toKey(b.nz_day);
      if (!byDay[key]) byDay[key] = [];
      byDay[key].push({
        evtype: 'booking',
        id: b.id,
        name: b.name,
        type: b.type,
        guests: b.guests,
        status: (b.status || '').toLowerCase()
      });
    });

    // Build grid cells
    const today = startOfDay(new Date());
    const days = [];
    for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) {
      const key = format(d, 'yyyy-MM-dd');
      days.push({
        dateKey: key,
        dateStr: format(d, 'd'),
        isToday: isSameDay(d, today),
        isPast: d < today,
        isOtherMonth: format(d, 'yyyy-MM') !== monthParam
      });
    }

    return res.render('pages/calendarMonthly', {
      days,
      events: byDay,
      monthLabel: format(firstOfMonth, 'MMMM yyyy'),
      monthParam,
      prevMonth: format(addMonths(firstOfMonth, -1), 'yyyy-MM'),
      nextMonth: format(addMonths(firstOfMonth,  1), 'yyyy-MM')
    });
  } catch (err) {
    console.error('Monthly calendar error:', err);
    return res.status(500).send('Failed to load monthly calendar');
  }
});

module.exports = router;
