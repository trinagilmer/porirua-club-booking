// backend/routes/dashboard.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const { requireLogin } = require("../Middleware/authMiddleware");

/**
 * Dashboard (staff + admin)
 */
router.get("/", requireLogin, async (req, res) => {
  try {
    // KPIs
    const kpiQuery = await pool.query(`
      WITH fn AS (
        SELECT 
          f.id, 
          f.status,
          COALESCE(f.totals_price, 0) AS price,
          COALESCE(f.totals_cost, 0) AS cost
        FROM functions f
      )
      SELECT
        SUM(CASE WHEN status IN ('confirmed','deposit_paid','invoiced','completed') THEN price ELSE 0 END) AS confirmed_price,
        SUM(CASE WHEN status IN ('confirmed','deposit_paid','invoiced','completed') THEN cost ELSE 0 END) AS confirmed_cost,
        SUM(CASE WHEN status IN ('lead','pending') THEN price ELSE 0 END) AS pipeline_price,
        SUM(CASE WHEN status IN ('lead','pending') THEN cost ELSE 0 END) AS pipeline_cost,
        COUNT(*) FILTER (WHERE status IN ('lead','pending')) AS pipeline_count
      FROM fn;
    `);

    const kpis = kpiQuery.rows[0] || {};

    // Upcoming functions (next 30 days)
    const upcoming = await pool.query(`
      SELECT f.id, f.event_name, f.status, f.event_date, f.event_time, f.totals_price,
             r.name AS room_name, c.name AS contact_name, f.attendees
      FROM functions f
      LEFT JOIN rooms r ON r.id = f.room_id
      LEFT JOIN contacts c ON c.id = f.contact_id
      WHERE f.event_date >= CURRENT_DATE
      ORDER BY f.event_date ASC, f.event_time ASC
      LIMIT 20;
    `);

    // Open tasks (assigned or unassigned)
    const tasks = await pool.query(`
      SELECT t.id, t.title, t.status, t.due_at, u.name AS assignee
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assigned_user_id
      WHERE t.status = 'open'
      ORDER BY t.due_at NULLS LAST
      LIMIT 10;
    `);

    // Leads (recent 7 days)
    const leads = await pool.query(`
      SELECT id, client_name, client_email, client_phone, status, desired_start
      FROM leads
      WHERE created_at >= now() - interval '7 days'
      ORDER BY created_at DESC
      LIMIT 10;
    `);

    res.render("Pages/dashboard", {
      user: req.session.user,
      kpis,
      upcoming: upcoming.rows,
      tasks: tasks.rows,
      leads: leads.rows
    });
  } catch (err) {
    console.error("[dashboard] error:", err);
    res.status(500).send("Failed to load dashboard");
  }
});

module.exports = router;
