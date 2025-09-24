// models/events.js
const { format } = require("date-fns");

/**
 * Generate an array of day objects between weekStart and weekEnd
 * Each day has: dateKey, dateStr, isToday, isPast
 */
function generateDaysArray(weekStart, weekEnd) {
  let days = [];
  let current = new Date(weekStart);

  while (current <= weekEnd) {
    days.push({
      dateKey: format(current, "yyyy-MM-dd"),
      dateStr: format(current, "EEE dd MMM"), // Example: Mon 23 Sep
      isToday: format(current, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd"),
      isPast: current < new Date()
    });

    // move to next day
    current.setDate(current.getDate() + 1);
  }

  return days;
}

/**
 * Dummy events fetcher.
 * Replace this later with a real DB query (e.g., PostgreSQL).
 */
async function getEventsBetween(start, end) {
  // Fake events mapped by dateKey
  return {
    [format(new Date(start), "yyyy-MM-dd")]: [
      {
        id: 1,
        event_name: "Board Meeting",
        contact_name: "Alice",
        contact_phone: "021123456",
        room: "Conference Room",
        attendees: 10,
        catering: true,
        bar_service: false
      }
    ],
    [format(new Date(end), "yyyy-MM-dd")]: [
      {
        id: 2,
        event_name: "Birthday Party",
        contact_name: "Bob",
        contact_phone: "022987654",
        room: "Main Hall",
        attendees: 50,
        catering: true,
        bar_service: true
      }
    ]
  };
}

module.exports = {
  generateDaysArray,
  getEventsBetween
};
