// backend/routes/dashboard.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const { requireLogin } = require("../Middleware/authMiddleware");

/**
 * Dashboard route (staff landing page)
 */
router.get("/", requireLogin, async (req, res, next) => {
  try {
    // --- KPIs ---
    const kpiSql = `
      SELECT
        COALESCE(SUM(CASE WHEN status IN ('confirmed','deposit_paid','invoiced','completed') THEN totals_price END), 0) AS confirmed_price,
        COALESCE(SUM(CASE WHEN status IN ('confirmed','deposit_paid','invoiced','completed') THEN totals_cost END), 0) AS confirmed_cost,
        COALESCE(SUM(CASE WHEN status IN ('lead','pending') THEN totals_price END), 0) AS pipeline_price,
        COUNT(*) FILTER (WHERE status IN ('lead','pending')) AS pipeline_count
      FROM functions;
    `;
    const kpiRow = (await pool.query(kpiSql)).rows[0];

    const kpis = {
      confirmed_price: Number(kpiRow.confirmed_price || 0),
      confirmed_cost: Number(kpiRow.confirmed_cost || 0),
      pipeline_price: Number(kpiRow.pipeline_price || 0),
      pipeline_count: Number(kpiRow.pipeline_count || 0),
    };

    // --- Upcoming functions (next 30 days) ---
    const upcomingSql = `
      SELECT f.id, f.event_name, f.event_date, f.event_time, f.attendees,
             f.status, f.totals_price, r.name AS room_name
      FROM functions f
      LEFT JOIN rooms r ON r.id = f.room_id
      WHERE f.event_date >= current_date
        AND f.status NOT IN ('cancelled')
      ORDER BY f.event_date ASC
      LIMIT 10;
    `;
    const upcoming = (await pool.query(upcomingSql)).rows;

    // --- Recent leads (last 10) ---
    const leadsSql = `
      SELECT id, client_name, client_email, client_phone,
             desired_start, status
      FROM leads
      ORDER BY created_at DESC
      LIMIT 10;
    `;
    const leads = (await pool.query(leadsSql)).rows;

    // --- Open tasks (assigned to current user OR unassigned) ---
    const tasksSql = `
      SELECT t.id, t.title, t.due_at,
             u.name AS assignee
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assigned_user_id
      WHERE t.status = 'open'
        AND (t.assigned_user_id IS NULL OR t.assigned_user_id = $1)
      ORDER BY t.due_at NULLS LAST, t.created_at ASC
      LIMIT 10;
    `;
    const tasks = (await pool.query(tasksSql, [req.session.user.id])).rows;

    // --- Revenue Trend (last 12 months, confirmed+) ---
    const revenueSql = `
      SELECT to_char(date_trunc('month', event_date), 'Mon YYYY') AS label,
             SUM(totals_price) AS revenue
      FROM functions
      WHERE status IN ('confirmed','deposit_paid','invoiced','completed')
        AND event_date >= (current_date - interval '12 months')
      GROUP BY 1
      ORDER BY MIN(event_date);
    `;
    const revRows = (await pool.query(revenueSql)).rows;

    const graph = {
      labels: revRows.map(r => r.label),
      data: revRows.map(r => Number(r.revenue || 0)),
    };

    // Render EJS view
    res.render("Pages/dashboard", {
      kpis,
      upcoming,
      leads,
      tasks,
      graph,
      user: req.session.user,
    });
  } catch (err) {
    console.error("Dashboard load error:", err);
    next(err);
  }
});

module.exports = router;
