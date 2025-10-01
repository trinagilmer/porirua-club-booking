// backend/routes/dashboard.js
const express = require("express");
const pool = require("../db");
const { startOfMonth, subMonths, format } = require("date-fns");
const { requireLogin } = require("../Middleware/authMiddleware");

const router = express.Router();

// Dashboard main route
router.get("/", requireLogin, async (req, res, next) => {
  try {
    const userId = req.session.user?.id;

    // ---- 1. KPIs ----
    const { rows: kpiRows } = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN status IN ('confirmed','deposit_paid','invoiced','completed')
                          THEN totals_price ELSE 0 END),0) AS confirmed_price,
        COALESCE(SUM(CASE WHEN status IN ('confirmed','deposit_paid','invoiced','completed')
                          THEN totals_cost ELSE 0 END),0) AS confirmed_cost,
        COALESCE(SUM(CASE WHEN status IN ('lead','pending')
                          THEN totals_price ELSE 0 END),0) AS pipeline_price,
        COUNT(*) FILTER (WHERE status IN ('lead','pending')) AS pipeline_count
      FROM functions
    `);
    const kpis = kpiRows[0];

    // ---- 2. Revenue Trend (last 12 months) ----
    const startDate = startOfMonth(subMonths(new Date(), 11));
    const { rows: revenueRows } = await pool.query(
      `
      SELECT to_char(date_trunc('month', event_start), 'YYYY-MM') AS ym,
             SUM(totals_price) AS revenue
      FROM functions
      WHERE status IN ('confirmed','deposit_paid','invoiced','completed')
        AND event_start >= $1
      GROUP BY ym
      ORDER BY ym ASC
      `,
      [startDate]
    );

    const graph = {
      labels: revenueRows.map(r => r.ym),
      data: revenueRows.map(r => parseFloat(r.revenue || 0)),
    };

    // ---- 3. Upcoming Functions (next 30 days) ----
    const { rows: upcoming } = await pool.query(
      `
      SELECT f.id, f.event_name, f.attendees, f.status, f.totals_price,
             f.event_date, f.event_time,
             r.name AS room_name
      FROM functions f
      LEFT JOIN rooms r ON r.id = f.room_id
      WHERE f.event_start >= now()
        AND f.event_start <= now() + interval '30 days'
      ORDER BY f.event_start ASC
      `
    );

    upcoming.forEach(fn => {
      fn.event_date_str = fn.event_date
        ? format(fn.event_date, "yyyy-MM-dd")
        : "";
    });

    // ---- 4. Recent Leads ----
    const { rows: leads } = await pool.query(
      `
      SELECT id, client_name, client_email, client_phone, status, desired_start
      FROM leads
      ORDER BY created_at DESC
      LIMIT 10
      `
    );

    leads.forEach(ld => {
      ld.desired_start_str = ld.desired_start
        ? format(ld.desired_start, "yyyy-MM-dd")
        : "";
    });

    // ---- 5. My Tasks (open) ----
    const { rows: tasks } = await pool.query(
      `
      SELECT t.id, t.title, t.due_at, u.name AS assignee
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assigned_user_id
      WHERE t.status = 'open'
        AND (t.assigned_user_id = $1 OR t.assigned_user_id IS NULL)
      ORDER BY t.due_at NULLS LAST, t.created_at ASC
      LIMIT 10
      `,
      [userId]
    );

    tasks.forEach(t => {
      t.due_at_str = t.due_at ? format(t.due_at, "yyyy-MM-dd") : "";
    });

    // ---- Render view ----
   res.render("layout", {
  title: "Dashboard",
  body: ejs.render(fs.readFileSync(path.join(__dirname, "../Views/Pages/dashboard.ejs"), "utf8"), {
    kpis,
    graph,
    upcoming,
    leads,
    tasks,
    active: "dashboard"
  })
});


module.exports = router;

