// backend/routes/functions.js
const express = require("express");
const pool = require("../db");
const router = express.Router();
const { requireLogin, setDbUserContext } = require("../Middleware/authMiddleware");

// Middleware for auditing context
router.use(requireLogin, setDbUserContext);

// Create new function (optionally from booking)
router.post("/", async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { booking_id, event_name, room, attendees, event_date, event_time } = req.body;

    await client.query("BEGIN");

    const fnRes = await client.query(
      `INSERT INTO functions (booking_id, event_name, room, attendees, event_date, event_time, status)
       VALUES ($1,$2,$3,$4,$5,$6,'pending')
       RETURNING *`,
      [booking_id || null, event_name, room, attendees, event_date, event_time]
    );

    await client.query("COMMIT");
    res.redirect(`/staff/functions/${fnRes.rows[0].id}/edit`);
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
});

// Save-all transactional update
router.post("/:id/save-all", async (req, res, next) => {
  const client = await pool.connect();
  try {
    const id = req.params.id;
    const { core, services, menus } = req.body;

    await client.query("BEGIN");

    // Core function update
    await client.query(
      `UPDATE functions SET 
         status=$1, event_name=$2, room=$3, attendees=$4, catering=$5, bar_service=$6,
         bar_type=$7, bar_tab_amount=$8, bar_notes=$9, notes=$10, event_date=$11, event_time=$12
       WHERE id=$13`,
      [
        core.status, core.event_name, core.room, core.attendees, core.catering,
        core.bar_service, core.bar_type, core.bar_tab_amount, core.bar_notes,
        core.notes, core.event_date, core.event_time, id
      ]
    );

    // Service updates
    for (const s of services.updates) {
      await client.query(
        `UPDATE function_services SET service_name=$1, qty=$2, price=$3, notes=$4
         WHERE id=$5 AND function_id=$6`,
        [s.service_name, s.qty, s.price, s.notes, s.id, id]
      );
    }
    for (const s of services.creates) {
      await client.query(
        `INSERT INTO function_services (function_id, service_name, qty, price, notes)
         VALUES ($1,$2,$3,$4,$5)`,
        [id, s.service_name, s.qty, s.price, s.notes]
      );
    }
    if (services.deletes.length) {
      await client.query(
        `DELETE FROM function_services WHERE id = ANY($1) AND function_id=$2`,
        [services.deletes, id]
      );
    }

    // Menu updates
    for (const m of menus.updates) {
      await client.query(
        `UPDATE function_menus SET qty=$1, price=$2, notes=$3
         WHERE function_id=$4 AND menu_id=$5`,
        [m.qty, m.price, m.notes, id, m.menu_id]
      );
    }
    for (const m of menus.creates) {
      await client.query(
        `INSERT INTO function_menus (function_id, menu_id, qty, price, notes)
         VALUES ($1,$2,$3,$4,$5)`,
        [id, m.menu_id, m.qty, m.price, m.notes]
      );
    }
    if (menus.deletes.length) {
      await client.query(
        `DELETE FROM function_menus WHERE function_id=$1 AND menu_id = ANY($2)`,
        [id, menus.deletes]
      );
    }

    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
});

// Patch status
router.patch("/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    await pool.query(
      `UPDATE functions SET status=$1 WHERE id=$2`,
      [status, id]
    );

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

