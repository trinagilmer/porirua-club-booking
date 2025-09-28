// backend/Models/events.js
const { format } = require('date-fns');
const pool = require('../db');

// Build a reliable start datetime for each function
const startsAtSql = `
  COALESCE(
    (f.event_date::timestamp + COALESCE(f.event_time, '00:00'::time)),
    f.created_at
  )
`;

/** Normalize to start-of-day */
function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Create an array of day objects from weekStart to weekEnd (inclusive) */
function generateDaysArray(weekStart, weekEnd) {
  const days = [];
  const start = startOfDay(weekStart);
  const end = startOfDay(weekEnd);
  const today = startOfDay(new Date());

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push({
      dateKey: format(d, 'yyyy-MM-dd'),
      dateStr: format(d, 'EEE dd MMM'), // e.g. Mon 23 Sep
      isToday: format(d, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'),
      isPast: d < today,
    });
  }
  return days;
}

/**
 * Fetch functions whose computed starts_at falls between weekStart and weekEnd (inclusive).
 * Returns an object keyed by YYYY-MM-DD with arrays of event rows.
 *
 * @param {Date|string} weekStart
 * @param {Date|string} weekEnd
 */
async function getEventsBetween(weekStart, weekEnd) {
  try {
    const { rows } = await pool.query(
      `
      SELECT
        f.id,
        f.event_name,
        f.room,
        f.attendees,
        f.status,
        ${startsAtSql}         AS starts_at,
        (${startsAtSql})::date AS day,
        b.name  AS contact_name,
        b.phone AS contact_phone
      FROM functions f
      LEFT JOIN bookings b ON b.id = f.booking_id
      WHERE ${startsAtSql} >= $1::timestamp
        AND ${startsAtSql} <= $2::timestamp
      ORDER BY ${startsAtSql} ASC, f.id ASC
      `,
      [weekStart, weekEnd]
    );

    // Group by dateKey
    const events = {};
    for (const r of rows) {
      const dateKey = format(new Date(r.day), 'yyyy-MM-dd');
      if (!events[dateKey]) events[dateKey] = [];
      events[dateKey].push({
        id: r.id,
        event_name: r.event_name,
        room: r.room,
        attendees: r.attendees,
        status: r.status,
        contact_name: r.contact_name,
        contact_phone: r.contact_phone,
        starts_at: r.starts_at, // JS Date object from pg
      });
    }

    return events;
  } catch (err) {
    console.error('Error in getEventsBetween:', err);
    return {};
  }
}

module.exports = {
  generateDaysArray,
  getEventsBetween,
};

