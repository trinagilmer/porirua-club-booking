// backend/routes/audit.js
const express = require("express");
const pool = require("../db");
const { requireLogin, requireAdmin } = require("../Middleware/authMiddleware");

const router = express.Router();

// Recent activity feed (last 100 entries)
router.get("/recent", requireLogin, requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, entity_type, entity_id, action, at,
             actor_name, actor_email
      FROM public.report_audit_trail_live
    `);

    res.render("audit/recent", { activities: rows });
  } catch (err) {
    console.error("[audit/recent] error:", err);
    res.status(500).send("Failed to load audit trail");
  }
});

module.exports = router;
