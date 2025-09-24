const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET all functions with services
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT f.*, json_agg(s.*) AS services
      FROM functions f
      LEFT JOIN services s ON f.id = s.function_id
      GROUP BY f.id
      ORDER BY f.datetime ASC NULLS LAST;
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching functions:", err.message);
    res.status(500).json({ error: "Failed to fetch functions" });
  }
});

// POST new function with optional services
router.post("/", async (req, res) => {
  const { booking_id, event_name, room, attendees, catering, bar_service, notes, services } = req.body;

  if (!booking_id || !event_name) {
    return res.status(400).json({ error: "Missing required fields: booking_id, event_name" });
  }

  try {
    // Insert function
    const funcResult = await pool.query(
      `INSERT INTO functions (booking_id, event_name, room, attendees, catering, bar_service, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [booking_id, event_name, room, attendees, catering, bar_service, notes]
    );

    const newFunction = funcResult.rows[0];

    // Insert services if provided
    if (services && Array.isArray(services)) {
      for (const svc of services) {
        await pool.query(
          `INSERT INTO services (function_id, service_name, qty, price, notes)
           VALUES ($1, $2, $3, $4, $5)`,
          [newFunction.id, svc.service_name, svc.qty, svc.price, svc.notes]
        );
      }
    }

    // Return function with services
    const fullResult = await pool.query(
      `SELECT f.*, json_agg(s.*) AS services
       FROM functions f
       LEFT JOIN services s ON f.id = s.function_id
       WHERE f.id = $1
       GROUP BY f.id`,
      [newFunction.id]
    );

    res.status(201).json(fullResult.rows[0]);
  } catch (err) {
    console.error("Error inserting function:", err.message);
    res.status(500).json({ error: "Database insert failed" });
  }
});

// 🟢 Unified run sheet endpoint (grouped | flat | csv)
router.get("/:id/run-sheet", async (req, res) => {
  const { id } = req.params;
  const format = (req.query.format || "grouped").toLowerCase();

  try {
    if (format === "flat" || format === "csv") {
      // Flat row format
      const result = await pool.query(
        `SELECT f.id AS function_id,
                f.booking_id,
                f.event_name,
                f.room,
                f.attendees,
                f.catering,
                f.bar_service,
                f.notes AS function_notes,
                f.created_at,
                s.id AS service_id,
                s.service_name,
                s.qty,
                s.price,
                s.notes AS service_notes
         FROM functions f
         LEFT JOIN services s ON f.id = s.function_id
         WHERE f.id = $1
         ORDER BY s.id`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Function not found" });
      }

      if (format === "csv") {
        // Convert flat rows to CSV
        const rows = result.rows;
        const header = Object.keys(rows[0]).join(",");
        const csv = [
          header,
          ...rows.map(r =>
            Object.values(r)
              .map(v => (v === null ? "" : `"${String(v).replace(/"/g, '""')}"`))
              .join(",")
          )
        ].join("\n");

        res.header("Content-Type", "text/csv");
        res.attachment(`function_${id}_run_sheet.csv`);
        return res.send(csv);
      }

      // Default to flat JSON
      return res.json(result.rows);
    } else {
      // Grouped format
      const result = await pool.query(
        `SELECT f.*,
          COALESCE(
            json_agg(
              json_build_object(
                'id', s.id,
                'service_name', s.service_name,
                'qty', s.qty,
                'price', s.price,
                'notes', s.notes
              )
            ) FILTER (WHERE s.id IS NOT NULL),
            '[]'
          ) AS services
        FROM functions f
        LEFT JOIN services s ON f.id = s.function_id
        WHERE f.id = $1
        GROUP BY f.id`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Function not found" });
      }

      return res.json(result.rows[0]);
    }
  } catch (err) {
    console.error("Error fetching run sheet:", err.message);
    res.status(500).json({ error: "Failed to fetch run sheet" });
  }
});
const { parseISO, startOfWeek, endOfWeek, eachDayOfInterval, format, startOfDay, isSameDay, addWeeks } = require("date-fns");


// 🟢 Weekly HTML calendar view (Monday → Sunday)
router.get("/calendar/weekly", async (req, res) => {
  let { start, nav } = req.query;

  if (!start) {
    return res.status(400).send("Missing required query param: start (YYYY-MM-DD)");
  }

  // Adjust week if "prev" or "next" is clicked
  let weekStart = startOfWeek(parseISO(start), { weekStartsOn: 1 });
  if (nav === "prev") weekStart = addWeeks(weekStart, -1);
  if (nav === "next") weekStart = addWeeks(weekStart, 1);

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

  try {
    // Query functions + booking contact
    const result = await pool.query(
      `SELECT f.id, f.event_name, f.room, f.attendees, f.catering, f.bar_service,
              b.name AS contact_name, b.phone AS contact_phone,
              f.created_at::date AS event_date
       FROM functions f
       JOIN bookings b ON f.booking_id = b.id
       WHERE f.created_at BETWEEN $1 AND $2
       ORDER BY f.created_at ASC`,
      [weekStart, weekEnd]
    );

    // Group by dateKey
    const events = {};
    result.rows.forEach(fn => {
      const dateKey = format(fn.event_date, "yyyy-MM-dd");
      if (!events[dateKey]) events[dateKey] = [];
      events[dateKey].push(fn);
    });

    // Build week days
    const today = startOfDay(new Date());
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd }).map(d => ({
      dateKey: format(d, "yyyy-MM-dd"),
      dateStr: format(d, "EEEE dd MMM yyyy"),
      isPast: d < today,
      isToday: isSameDay(d, today)
    }));

    res.render("weeklyCalendar", {
      start: format(weekStart, "yyyy-MM-dd"),
      end: format(weekEnd, "yyyy-MM-dd"),
      days,
      events,
      format
    });
  } catch (err) {
    console.error("Error fetching weekly calendar:", err.message);
    res.status(500).send("Failed to fetch weekly calendar");
  }
});

// 🟢 Weekly PDF export
router.get("/calendar/weekly/pdf", async (req, res) => {
  const { start } = req.query;

  if (!start) {
    return res.status(400).send("Missing required query param: start (YYYY-MM-DD)");
  }

  try {
    // Week boundaries (Monday start)
    const weekStart = startOfWeek(parseISO(start), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(parseISO(start), { weekStartsOn: 1 });

    // Query functions + booking contact
    const result = await pool.query(
      `SELECT f.id, f.event_name, f.room, f.attendees, f.catering, f.bar_service,
              b.name AS contact_name, b.phone AS contact_phone,
              f.created_at::date AS event_date
       FROM functions f
       JOIN bookings b ON f.booking_id = b.id
       WHERE f.created_at BETWEEN $1 AND $2
       ORDER BY f.created_at ASC`,
      [weekStart, weekEnd]
    );

    // Group by date
    const events = {};
    result.rows.forEach(fn => {
      const dateStr = format(fn.event_date, "EEEE dd MMM yyyy"); // Pretty format
      if (!events[dateStr]) events[dateStr] = [];
      events[dateStr].push(fn);
    });
const today = startOfDay(new Date());

const days = eachDayOfInterval({ start: weekStart, end: weekEnd }).map(d => ({
  dateKey: format(d, "yyyy-MM-dd"),       // machine key
  dateStr: format(d, "EEEE dd MMM yyyy"), // display label
  isPast: d < today,
  isToday: isSameDay(d, today)
}));



    // Render HTML with EJS
    const html = await new Promise((resolve, reject) => {
      res.render(
        "weeklyCalendar",
        {
          start: weekStart,
          end: weekEnd,
          days,
          events,
          format // 👈 now usable in EJS
        },
        (err, rendered) => {
          if (err) reject(err);
          else resolve(rendered);
        }
      );
    });

    // Generate PDF
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true
    });

    await browser.close();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="weekly_calendar_${start}.pdf"`
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Error generating PDF:", err.message);
    res.status(500).send("Failed to generate weekly PDF");
  }
});

router.get("/:id/detail", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT f.*, 
              b.name AS contact_name, 
              b.phone AS contact_phone, 
              b.email AS contact_email
       FROM functions f
       JOIN bookings b ON f.booking_id = b.id
       WHERE f.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).send("Event not found");
    }

    const fn = result.rows[0];

    // Fetch related services
    const services = await pool.query(
      `SELECT service_name, qty, price, notes
       FROM services
       WHERE function_id = $1`,
      [id]
    );

    // Render run sheet
    res.render("functionDetail", {
      fn,
      services: services.rows
    });
  } catch (err) {
    console.error("Error fetching function detail:", err.message);
    res.status(500).send("Failed to fetch function detail");
  }
});

module.exports = router;
