// backend/routes/dashboard.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const { requireLogin } = require("../Middleware/authMiddleware");

// Dashboard (GET /dashboard)
router.get("/", requireLogin, async (req, res, next) => {
  try {
    const start = req.query.start || new Date().toISOString().slice(0, 10);
    const end = req.query.end || new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);

    // KPIs
    const { rows: [kpi] } = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'confirmed') AS confirmed_count,
        COALESCE(SUM(totals_price) FILTER (WHERE status = 'confirmed'),0) AS confirmed_value,
        COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
        COUNT(*) FILTER (WHERE status = 'lead') AS lead_count
      FROM functions
      WHERE event_start::date BETWEEN $1 AND $2
    `, [start, end]);

    // Upcoming functions
    const { rows: upcoming } = await pool.query(`
      SELECT
        f.id,
        f.event_name,
        f.attendees,
        f.status,
        f.event_start,
        f.event_end,
        r.name AS room,
        COALESCE(SUM(fi.line_total_price),0) AS est_total
      FROM functions f
      LEFT JOIN rooms r ON r.id = f.room_id
      LEFT JOIN function_items fi ON fi.function_id = f.id
      WHERE f.event_start::date BETWEEN $1 AND $2
      GROUP BY f.id, r.name
      ORDER BY f.event_start ASC
    `, [start, end]);

    // Open tasks
    const { rows: tasks } = await pool.query(`
      SELECT t.id, t.title, t.due_at AS due_date, u.name AS assignee
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assigned_user_id
      WHERE t.status = 'open'
      ORDER BY t.due_at NULLS LAST
      LIMIT 10
    `);

    res.render("Pages/dashboard", {
      user: req.session.user,
      kpi,
      upcoming,
      tasks,
      start,
      end
    });
  } catch (err) {
    console.error("[dashboard] error:", err);
    next(err);
  }
});

module.exports = router;

