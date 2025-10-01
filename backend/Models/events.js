// backend/Models/events.js
const pool = require("../db");
const { addDays, eachDayOfInterval, format } = require("date-fns");

/**
 * Fetch events (functions) between two dates.
 */
async function getEventsBetween(startDate, endDate) {
  const { rows } = await pool.query(
    `
    SELECT
      f.id,
      f.event_name AS title,
      f.attendees,
      f.status,
      f.room,
      f.event_date,
      f.event_time,
      (f.event_date::timestamp + COALESCE(f.event_time, '00:00'::time)) AS start_at
    FROM functions f
    WHERE f.event_date BETWEEN $1::date AND $2::date
    ORDER BY start_at ASC
    `,
    [format(startDate, "yyyy-MM-dd"), format(endDate, "yyyy-MM-dd")]
  );

  // Normalize output for frontend
  return rows.map(r => ({
    id: r.id,
    title: r.title,
    attendees: r.attendees,
    status: r.status,
    room: r.room,
    start: r.start_at,  // ISO string works fine in JS calendars
  }));
}

/**
 * Generate an array of days between start and end (for weekly view).
 */
function generateDaysArray(startDate, endDate) {
  return eachDayOfInterval({ start: startDate, end: endDate }).map(d => ({
    date: format(d, "yyyy-MM-dd"),
    label: format(d, "EEE d MMM"),
  }));
}

module.exports = { getEventsBetween, generateDaysArray };


