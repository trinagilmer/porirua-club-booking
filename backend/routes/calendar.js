/// routes/calendar.js
const express = require("express");
const router = express.Router();
const { format, startOfWeek, endOfWeek } = require("date-fns");
const { getEventsBetween, generateDaysArray } = require("../models/events");

// Weekly calendar route
router.get("/weekly", async (req, res) => {
  let startParam = req.query.start;
  let nav = req.query.nav;

  // Default to today if no start given
  let startDate = startParam ? new Date(startParam) : new Date();

  // Navigation
  if (nav === "prev") startDate.setDate(startDate.getDate() - 7);
  if (nav === "next") startDate.setDate(startDate.getDate() + 7);

  // Week boundaries (Monday → Sunday)
  let weekStart = startOfWeek(startDate, { weekStartsOn: 1 });
  let weekEnd = endOfWeek(startDate, { weekStartsOn: 1 });

  // Query DB (or dummy data for now)
  let events = await getEventsBetween(weekStart, weekEnd);
  let days = generateDaysArray(weekStart, weekEnd);

  // Render weekly calendar view
  res.render("weeklyCalendar", {
    start: format(weekStart, "yyyy-MM-dd"),
    end: format(weekEnd, "yyyy-MM-dd"),
    days,
    events
  });
});

module.exports = router;
