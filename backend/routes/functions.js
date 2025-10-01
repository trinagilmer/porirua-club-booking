// backend/routes/functions.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const { format } = require("date-fns");

const ALLOWED_STATUS = new Set(["pending", "confirmed", "cancelled"]);

/* ============================================================================
   LIST + STATS
============================================================================ */
router.get("/", async (req, res) => {
  const { status, exclude_status, q, from, to } = req.query;
  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const size = Math.min(Math.max(parseInt(req.query.size || "20", 10), 1), 100);

  const filters = [];
  const vals = [];
  let i = 1;

  if (status && ALLOWED_STATUS.has(status.toLowerCase())) {
    filters.push(`f.status = $${i++}`);
    vals.push(status.toLowerCase());
  } else if (exclude_status && ALLOWED_STATUS.has(exclude_status.toLowerCase())) {
    filters.push(`f.status IS DISTINCT FROM $${i++}`);
    vals.push(exclude_status.toLowerCase());
  }
  if (from) { filters.push(`f.start_at >= $${i++}::date`); vals.push(from); }
  if (to)   { filters.push(`f.end_at   <= $${i++}::date`); vals.push(to);   }
  if (q) {
    filters.push(`(f.event_name ILIKE $${i} OR f.notes ILIKE $${i})`);
    vals.push(`%${q}%`); i++;
  }
  const whereSql = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const offset = (page - 1) * size;

  try {
    const listSql = `
      SELECT
        f.id,
        f.event_name,
        f.start_at,
        f.end_at,
        f.status,
        COALESCE(SUM(fi.line_total_price), 0) AS est_total
      FROM functions f
      LEFT JOIN function_items fi ON fi.function_id = f.id AND fi.is_archived = false
      ${whereSql}
      GROUP BY f.id
      ORDER BY f.start_at ASC NULLS LAST, f.id ASC
      LIMIT $${i++} OFFSET $${i++}
    `;
    const countSql = `SELECT COUNT(*) AS total FROM functions f ${whereSql}`;

    const [listRes, countRes] = await Promise.all([
      pool.query(listSql, [...vals, size, offset]),
      pool.query(countSql, vals),
    ]);

    res.json({
      page,
      size,
      total: Number(countRes.rows[0]?.total || 0),
      rows: listRes.rows,
    });
  } catch (err) {
    console.error("list error:", err);
    res.status(500).json({ error: "Failed to load functions" });
  }
});

router.get("/stats", async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status='pending')   AS pending,
        COUNT(*) FILTER (WHERE status='confirmed') AS confirmed,
        COUNT(*) FILTER (WHERE status='cancelled') AS cancelled
      FROM functions
    `);
    const c = rows[0] || {};
    res.json({
      pending: Number(c.pending || 0),
      confirmed: Number(c.confirmed || 0),
      cancelled: Number(c.cancelled || 0),
      total: Number(c.pending || 0) + Number(c.confirmed || 0) + Number(c.cancelled || 0),
    });
  } catch (err) {
    console.error("stats error:", err);
    res.status(500).json({ error: "Failed to load stats" });
  }
});

/* ============================================================================
   DETAIL
============================================================================ */
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const fnRes = await pool.query(
      `SELECT f.*
       FROM functions f
       WHERE f.id = $1`,
      [id]
    );
    if (!fnRes.rows[0]) return res.status(404).json({ error: "Function not found" });
    const fn = fnRes.rows[0];

    const itemsRes = await pool.query(
      `SELECT *
       FROM function_items
       WHERE function_id=$1
       ORDER BY id ASC`,
      [id]
    );

    return res.json({ function: fn, items: itemsRes.rows });
  } catch (err) {
    console.error("Error fetching function detail:", err);
    return res.status(500).json({ error: "Failed to fetch function detail" });
  }
});

/* ============================================================================
   UPDATE CORE
============================================================================ */
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { event_name, attendees, notes, start_at, end_at, status } = req.body;

  try {
    const fields = [];
    const values = [];
    let i = 1;

    if (event_name !== undefined) { fields.push(`event_name=$${i++}`); values.push(event_name); }
    if (attendees  !== undefined) { fields.push(`attendees=$${i++}`);  values.push(attendees); }
    if (notes      !== undefined) { fields.push(`notes=$${i++}`);      values.push(notes); }
    if (start_at   !== undefined) { fields.push(`start_at=$${i++}`);   values.push(start_at); }
    if (end_at     !== undefined) { fields.push(`end_at=$${i++}`);     values.push(end_at); }
    if (status     !== undefined && ALLOWED_STATUS.has(status.toLowerCase())) {
      fields.push(`status=$${i++}`);
      values.push(status.toLowerCase());
    }

    if (!fields.length) {
      const { rows } = await pool.query(`SELECT * FROM functions WHERE id=$1`, [id]);
      if (!rows[0]) return res.status(404).json({ error: "Function not found" });
      return res.json(rows[0]);
    }

    const { rows } = await pool.query(
      `UPDATE functions SET ${fields.join(", ")} WHERE id=$${i} RETURNING *`,
      [...values, id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Function not found" });
    return res.json(rows[0]);
  } catch (err) {
    console.error("Error updating function:", err);
    return res.status(500).json({ error: "Failed to update function" });
  }
});

/* ============================================================================
   ADD ITEMS (Services / Menus)
============================================================================ */
router.post("/:id/items", async (req, res) => {
  const { id } = req.params;
  const { item_type, ref_id, description, qty, unit_price } = req.body;
  if (!item_type) return res.status(400).json({ error: "item_type required" });

  try {
    const { rows } = await pool.query(
      `INSERT INTO function_items (function_id, item_type, ref_id, description, qty, unit_price, line_total_price)
       VALUES ($1,$2,$3,$4,$5,$6,COALESCE($5,1) * COALESCE($6,0))
       RETURNING *`,
      [id, item_type, ref_id || null, description || null, qty || 1, unit_price || 0]
    );
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Error adding item:", err);
    return res.status(500).json({ error: "Failed to add item" });
  }
});

router.patch("/items/:itemId", async (req, res) => {
  const { itemId } = req.params;
  const { description, qty, unit_price, is_archived } = req.body;

  try {
    const fields = [];
    const values = [];
    let i = 1;

    if (description !== undefined) { fields.push(`description=$${i++}`); values.push(description); }
    if (qty         !== undefined) { fields.push(`qty=$${i++}`);         values.push(qty); }
    if (unit_price  !== undefined) { fields.push(`unit_price=$${i++}`);  values.push(unit_price); }
    if (is_archived !== undefined) { fields.push(`is_archived=$${i++}`); values.push(is_archived); }

    if (!fields.length) {
      const { rows } = await pool.query(`SELECT * FROM function_items WHERE id=$1`, [itemId]);
      if (!rows[0]) return res.status(404).json({ error: "Item not found" });
      return res.json(rows[0]);
    }

    values.push(itemId);
    const { rows } = await pool.query(
      `UPDATE function_items SET ${fields.join(", ")} WHERE id=$${i} RETURNING *`,
      values
    );
    if (!rows[0]) return res.status(404).json({ error: "Item not found" });
    return res.json(rows[0]);
  } catch (err) {
    console.error("Error updating item:", err);
    return res.status(500).json({ error: "Failed to update item" });
  }
});

router.delete("/items/:itemId", async (req, res) => {
  const { itemId } = req.params;
  try {
    const { rowCount } = await pool.query(`DELETE FROM function_items WHERE id=$1`, [itemId]);
    if (!rowCount) return res.status(404).json({ error: "Item not found" });
    return res.status(204).end();
  } catch (err) {
    console.error("Error deleting item:", err);
    return res.status(500).json({ error: "Failed to delete item" });
  }
});

/* ============================================================================
   STATUS
============================================================================ */
router.patch("/:id/status", async (req, res) => {
  const { id } = req.params;
  const status = String(req.body.status || "").toLowerCase();
  if (!ALLOWED_STATUS.has(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  try {
    const { rows } = await pool.query(
      `UPDATE functions SET status=$1 WHERE id=$2 RETURNING id, status`,
      [status, id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Function not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("Update function status error:", err);
    res.status(500).json({ error: "Failed to update status" });
  }
});

router.post("/:id/confirm", async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `UPDATE functions SET status='confirmed' WHERE id=$1 RETURNING id, status`,
      [id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Function not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("Confirm function error:", err);
    res.status(500).json({ error: "Failed to confirm function" });
  }
});

router.post("/:id/cancel", async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `UPDATE functions SET status='cancelled' WHERE id=$1 RETURNING id, status`,
      [id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Function not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("Cancel function error:", err);
    res.status(500).json({ error: "Failed to cancel function" });
  }
});

module.exports = router;
