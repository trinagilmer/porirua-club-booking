const express = require("express");
const pool = require("../db");
const { startOfMonth, subMonths, format } = require("date-fns");
const { requireLogin } = require("../Middleware/authMiddleware");

const router = express.Router();

router.get("/", requireLogin, async (req, res, next) => {
  try {
    const userId = req.session.user?.id;

    // ---- Handle filters ----
    const { from, to, quick } = req.query;
    let fromDate = from ? new Date(from) : null;
    let toDate = to ? new Date(to) : null;

    if (quick === "week") {
      fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 7);
      toDate = new Date();
    } else if (quick === "month") {
      fromDate = startOfMonth(new Date());
      toDate = new Date();
    }

    // date filter SQL condition
    let dateFilterSQL = "";
    let params = [];
    if (fromDate && toDate) {
      dateFilterSQL = "AND f.event_start BETWEEN $1 AND $2";
      params.push(fromDate, toDate);
    } else if (fromDate) {
      dateFilterSQL = "AND f.event_start >= $1";
      params.push(fromDate);
    } else if (toDate) {
      dateFilterSQL = "AND f.event_start <= $1";
      params.push(toDate);
    }

    // ---- 1. KPIs ----
    const { rows: kpiRows } = await pool.query(
      `
      SELECT
        COALESCE(SUM(CASE WHEN status IN ('confirmed','deposit_paid','invoiced','completed')
                          THEN totals_price ELSE 0 END),0) AS confirmed_price,
        COALESCE(SUM(CASE WHEN status IN ('confirmed','deposit_paid','invoiced','completed')
                          THEN totals_cost ELSE 0 END),0) AS confirmed_cost,
        COALESCE(SUM(CASE WHEN status IN ('lead','pending')
                          THEN totals_price ELSE 0 END),0) AS pipeline_price,
        COUNT(*) FILTER (WHERE status IN ('lead','pending')) AS pipeline_count
      FROM functions f
      WHERE 1=1 ${dateFilterSQL}
      `,
      params
    );
    const kpis = kpiRows[0];

    // ---- 2. Revenue Trend (last 12 months or filtered) ----
    const defaultStart = startOfMonth(subMonths(new Date(), 11));
    const revenueStart = fromDate || defaultStart;

    const { rows: revenueRows } = await pool.query(
      `
      SELECT to_char(date_trunc('month', event_start), 'YYYY-MM') AS ym,
             SUM(totals_price) AS revenue
      FROM functions f
      WHERE status IN ('confirmed','deposit_paid','invoiced','completed')
        AND event_start >= $1
        ${toDate ? "AND event_start <= $2" : ""}
      GROUP BY ym
      ORDER BY ym ASC
      `,
      toDate ? [revenueStart, toDate] : [revenueStart]
    );

    const graph = {
      labels: revenueRows.map(r => r.ym),
      data: revenueRows.map(r => parseFloat(r.revenue || 0)),
    };

    // ---- 3. Upcoming Functions ----
    const { rows: upcoming } = await pool.query(
      `
      SELECT f.id, f.event_name, f.attendees, f.status, f.totals_price,
             f.event_date, f.event_time,
             r.name AS room_name
      FROM functions f
      LEFT JOIN rooms r ON r.id = f.room_id
      WHERE f.event_start >= now()
        ${dateFilterSQL ? dateFilterSQL.replace("f.", "f.") : "AND f.event_start <= now() + interval '30 days'"}
      ORDER BY f.event_start ASC
      `,
      params
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
      SELECT t.id, t.title, t.due_at, u.name AS assignee, t.status
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
    res.render("Pages/dashboard", {
      title: "Dashboard",
      active: "dashboard",
      kpis,
      graph,
      upcoming,
      leads,
      tasks,
      filters: { from, to }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
