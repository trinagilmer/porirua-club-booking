// backend/routes/functions.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { format } = require('date-fns');

const ALLOWED_STATUS = new Set(['pending','confirmed','cancelled']);

/**
 * Compute a sortable start datetime from event_date + event_time, fallback to created_at.
 */
const startsAtSql = `
  COALESCE(
    (f.event_date::timestamp + COALESCE(f.event_time, '00:00'::time)),
    f.created_at
  )
`;

/* ============================================================================
   LIST + STATS  (keep BEFORE any "/:id" routes)
============================================================================ */

/**
 * GET /api/functions
 * Query:
 *   status=pending|confirmed|cancelled
 *   exclude_status=...
 *   q=<search>
 *   from=YYYY-MM-DD
 *   to=YYYY-MM-DD
 *   page=<n> (default 1)
 *   size=<n> (default 20, max 100)
 * Returns rows with est_total safely aggregated (no duplicate inflation).
 */
router.get('/', async (req, res) => {
  const { status, exclude_status, q, from, to } = req.query;
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const size = Math.min(Math.max(parseInt(req.query.size || '20', 10), 1), 100);

  const filters = [];
  const vals = [];
  let i = 1;

  if (status && ALLOWED_STATUS.has(String(status).toLowerCase())) {
    filters.push(`f.status = $${i++}`); vals.push(String(status).toLowerCase());
  } else if (exclude_status && ALLOWED_STATUS.has(String(exclude_status).toLowerCase())) {
    filters.push(`(f.status IS DISTINCT FROM $${i++} OR f.status IS NULL)`);
    vals.push(String(exclude_status).toLowerCase());
  }
  if (from) { filters.push(`f.event_date >= $${i++}::date`); vals.push(from); }
  if (to)   { filters.push(`f.event_date <= $${i++}::date`); vals.push(to);   }
  if (q) {
    filters.push(`(
      f.event_name ILIKE $${i} OR
      f.notes      ILIKE $${i} OR
      b.name       ILIKE $${i} OR
      b.email      ILIKE $${i}
    )`);
    vals.push(`%${q}%`); i++;
  }
  const whereSql = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const offset = (page - 1) * size;

  try {
    const listSql = `
      WITH svc AS (
        SELECT function_id, SUM(COALESCE(price,0) * COALESCE(qty,1)) AS total_services
        FROM services
        GROUP BY function_id
      ),
      mn AS (
        SELECT fm.function_id,
               SUM(COALESCE(fm.price, m.price, 0) * COALESCE(fm.qty,1)) AS total_menus
        FROM function_menus fm
        JOIN menus m ON m.id = fm.menu_id
        GROUP BY fm.function_id
      )
      SELECT
        f.id, f.event_name, f.event_date, f.event_time, f.status,
        ${startsAtSql} AS starts_at,
        b.name AS contact_name, b.phone AS contact_phone, b.email AS contact_email,
        COALESCE(svc.total_services,0) + COALESCE(mn.total_menus,0) AS est_total
      FROM functions f
      LEFT JOIN bookings b ON b.id = f.booking_id
      LEFT JOIN svc ON svc.function_id = f.id
      LEFT JOIN mn  ON mn.function_id  = f.id
      ${whereSql}
      ORDER BY ${startsAtSql} ASC NULLS LAST, f.id ASC
      LIMIT $${i++} OFFSET $${i++}
    `;
    const countSql = `
      SELECT COUNT(*) AS total
      FROM functions f
      LEFT JOIN bookings b ON b.id = f.booking_id
      ${whereSql}
    `;

    const [listRes, countRes] = await Promise.all([
      pool.query(listSql, [...vals, size, offset]),
      pool.query(countSql, vals),
    ]);

    const total = Number(countRes.rows[0]?.total || 0);
    res.json({ page, size, total, rows: listRes.rows });
  } catch (err) {
    console.error('list error:', err);
    res.status(500).json({ error: 'Failed to load functions' });
  }
});

/**
 * GET /api/functions/stats → { pending, confirmed, cancelled, total }
 */
router.get('/stats', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status='pending')   AS pending,
        COUNT(*) FILTER (WHERE status='confirmed') AS confirmed,
        COUNT(*) FILTER (WHERE status='cancelled') AS cancelled
      FROM functions
    `);
    const c = rows[0] || { pending: 0, confirmed: 0, cancelled: 0 };
    const toIntSafe = v => Number.parseInt(v ?? 0, 10) || 0;
    const pending   = toIntSafe(c.pending);
    const confirmed = toIntSafe(c.confirmed);
    const cancelled = toIntSafe(c.cancelled);
    res.json({ pending, confirmed, cancelled, total: pending + confirmed + cancelled });
  } catch (err) {
    console.error('stats error:', err);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

/* ============================================================================
   DETAIL
============================================================================ */

/**
 * GET /api/functions/:id  → detail JSON (includes services, menus, est_total)
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const fnRes = await pool.query(
      `
      WITH svc AS (
        SELECT function_id, SUM(COALESCE(price,0) * COALESCE(qty,1)) AS total_services
        FROM services
        WHERE function_id = $1
        GROUP BY function_id
      ),
      mn AS (
        SELECT fm.function_id,
               SUM(COALESCE(fm.price, m.price, 0) * COALESCE(fm.qty,1)) AS total_menus
        FROM function_menus fm
        JOIN menus m ON m.id = fm.menu_id
        WHERE fm.function_id = $1
        GROUP BY fm.function_id
      )
      SELECT
        f.id, f.booking_id, f.event_name, f.room, f.attendees, f.status,
        f.catering, f.bar_service, f.bar_type, f.bar_tab_amount, f.bar_notes,
        f.notes, f.created_at, f.event_date, f.event_time,
        ${startsAtSql} AS starts_at,
        b.name  AS contact_name,
        b.phone AS contact_phone,
        b.email AS contact_email,
        COALESCE(svc.total_services,0) + COALESCE(mn.total_menus,0) AS est_total
      FROM functions f
      LEFT JOIN bookings b ON b.id = f.booking_id
      LEFT JOIN svc ON svc.function_id = f.id
      LEFT JOIN mn  ON mn.function_id  = f.id
      WHERE f.id = $1
      `,
      [id]
    );
    if (!fnRes.rows[0]) return res.status(404).json({ error: 'Function not found' });
    const fn = fnRes.rows[0];

    const services = (
      await pool.query(
        `SELECT id, function_id, service_name, qty, price, notes
         FROM services WHERE function_id=$1 ORDER BY id ASC`,
        [id]
      )
    ).rows;

    const menus = (
      await pool.query(
        `SELECT m.id AS menu_id, m.name, m.price AS base_price, m.serves,
                fm.qty, fm.notes, fm.price AS override_price
         FROM function_menus fm
         JOIN menus m ON m.id = fm.menu_id
         WHERE fm.function_id=$1
         ORDER BY m.name ASC`,
        [id]
      )
    ).rows;

    return res.json({ function: fn, services, menus });
  } catch (err) {
    console.error('Error fetching function detail:', err);
    return res.status(500).json({ error: 'Failed to fetch function detail' });
  }
});

/* ============================================================================
   UPDATE CORE
============================================================================ */

/**
 * PATCH /api/functions/:id → update core fields (JSON)
 * Accepts optional 'status'
 */
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    event_name, room, attendees,
    catering, bar_service, bar_type, bar_tab_amount, bar_notes,
    notes, event_date, event_time, status
  } = req.body;

  try {
    const mapping = [
      ['event_name',      toText(event_name)],
      ['room',            toText(room)],
      ['attendees',       toInt(attendees)],
      ['catering',        toBool(catering)],
      ['bar_service',     toBool(bar_service)],
      ['bar_type',        toText(bar_type)],
      ['bar_tab_amount',  toNumericOrNull(bar_tab_amount)],
      ['bar_notes',       toText(bar_notes)],
      ['notes',           toText(notes)],
      ['event_date',      toDateOrNull(event_date)],
      ['event_time',      toTimeOrNull(event_time)],
      ...(status !== undefined
        ? [['status', ALLOWED_STATUS.has(String(status).toLowerCase()) ? String(status).toLowerCase() : null]]
        : [])
    ];

    const sets = [];
    const vals = [];
    let i = 1;
    for (const [col, val] of mapping) {
      if (val !== undefined) { sets.push(`${col} = $${i++}`); vals.push(val); }
    }

    if (!sets.length) {
      const { rows } = await pool.query(`SELECT * FROM functions WHERE id=$1`, [id]);
      if (!rows[0]) return res.status(404).json({ error: 'Function not found' });
      return res.json(rows[0]);
    }

    const { rows } = await pool.query(
      `UPDATE functions SET ${sets.join(', ')} WHERE id=$${i} RETURNING *`,
      [...vals, id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Function not found' });
    return res.json(rows[0]);
  } catch (err) {
    console.error('Error updating function:', err);
    return res.status(500).json({ error: 'Failed to update function' });
  }
});

/* ============================================================================
   SERVICES
============================================================================ */

/**
 * POST /api/functions/:id/services → add service line
 */
router.post('/:id/services', async (req, res) => {
  const { id } = req.params;
  const { service_name, qty, price, notes } = req.body;
  if (!toText(service_name)) return res.status(400).json({ error: 'service_name required' });

  try {
    const { rows } = await pool.query(
      `INSERT INTO services (function_id, service_name, qty, price, notes)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, function_id, service_name, qty, price, notes`,
      [id, toText(service_name), toInt(qty), toNumericOrNull(price), toText(notes)]
    );
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error adding service:', err);
    return res.status(500).json({ error: 'Failed to add service' });
  }
});

/**
 * PATCH /api/functions/services/:serviceId → update service line (null-safe for name)
 */
router.patch('/services/:serviceId', async (req, res) => {
  const { serviceId } = req.params;
  const { service_name, qty, price, notes } = req.body;

  try {
    const fields = [];
    const values = [];
    let i = 1;

    if (service_name !== undefined) {
      const sv = toText(service_name);
      if (sv !== null) { fields.push(`service_name=$${i++}`); values.push(sv); }
    }
    if (qty   !== undefined) { fields.push(`qty=$${i++}`);   values.push(toInt(qty)); }
    if (price !== undefined) { fields.push(`price=$${i++}`); values.push(toNumericOrNull(price)); }
    if (notes !== undefined) { fields.push(`notes=$${i++}`); values.push(toText(notes)); }

    if (!fields.length) {
      const { rows } = await pool.query(
        `SELECT id, function_id, service_name, qty, price, notes FROM services WHERE id=$1`,
        [serviceId]
      );
      if (!rows[0]) return res.status(404).json({ error: 'Service not found' });
      return res.json(rows[0]);
    }

    values.push(serviceId);
    const { rows } = await pool.query(
      `UPDATE services SET ${fields.join(', ')} WHERE id=$${i} RETURNING id, function_id, service_name, qty, price, notes`,
      values
    );
    if (!rows[0]) return res.status(404).json({ error: 'Service not found' });
    return res.json(rows[0]);
  } catch (err) {
    console.error('Error updating service:', err);
    return res.status(500).json({ error: 'Failed to update service' });
  }
});

/**
 * DELETE /api/functions/services/:serviceId
 */
router.delete('/services/:serviceId', async (req, res) => {
  const { serviceId } = req.params;
  try {
    const { rowCount } = await pool.query(`DELETE FROM services WHERE id=$1`, [serviceId]);
    if (!rowCount) return res.status(404).json({ error: 'Service not found' });
    return res.status(204).end();
  } catch (err) {
    console.error('Error deleting service:', err);
    return res.status(500).json({ error: 'Failed to delete service' });
  }
});

/* ============================================================================
   MENUS
============================================================================ */

/**
 * POST /api/functions/:id/menus → attach a menu to the function
 */
router.post('/:id/menus', async (req, res) => {
  const { id } = req.params;
  const { menu_id, qty, notes, price } = req.body;
  if (!menu_id) return res.status(400).json({ error: 'menu_id required' });

  try {
    await pool.query(
      `INSERT INTO function_menus (function_id, menu_id, qty, notes${price != null ? ', price' : ''})
       VALUES ($1,$2,$3,$4${price != null ? ',$5' : ''})`,
      price != null
        ? [id, toInt(menu_id), toInt(qty), toText(notes), toNumericOrNull(price)]
        : [id, toInt(menu_id), toInt(qty), toText(notes)]
    );

    if (price != null) {
      await pool.query(`UPDATE menus SET price=$1 WHERE id=$2`, [toNumericOrNull(price), toInt(menu_id)]);
    }

    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error('Error adding function menu:', err);
    return res.status(500).json({ error: 'Failed to add function menu' });
  }
});

/**
 * PATCH /api/functions/:id/menus/:menuId → update qty/notes or price
 */
router.patch('/:id/menus/:menuId', async (req, res) => {
  const { id, menuId } = req.params;
  const { qty, notes, price } = req.body;

  try {
    const fields = [];
    const values = [];
    let i = 1;

    if (qty   !== undefined) { fields.push(`qty=$${i++}`);   values.push(toInt(qty)); }
    if (notes !== undefined) { fields.push(`notes=$${i++}`); values.push(toText(notes)); }
    if (price !== undefined) { fields.push(`price=$${i++}`); values.push(toNumericOrNull(price)); }

    if (fields.length) {
      values.push(id, toInt(menuId));
      await pool.query(
        `UPDATE function_menus SET ${fields.join(', ')} WHERE function_id=$${i++} AND menu_id=$${i}`,
        values
      );
    }

    if (price !== undefined) {
      await pool.query(`UPDATE menus SET price=$1 WHERE id=$2`, [toNumericOrNull(price), toInt(menuId)]);
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error('Error updating function menu:', err);
    return res.status(500).json({ error: 'Failed to update function menu' });
  }
});

/* ============================================================================
   RUN SHEET
============================================================================ */

/**
 * GET /api/functions/:id/run-sheet?format=json|csv
 */
router.get('/:id/run-sheet', async (req, res) => {
  const { id } = req.params;
  const output = (req.query.format || 'json').toLowerCase();
  try {
    const { rows } = await pool.query(
      `
      SELECT
        f.*,
        ${startsAtSql} AS starts_at,
        s.id AS service_id, s.service_name, s.qty, s.price, s.notes AS service_notes
      FROM functions f
      LEFT JOIN services s ON s.function_id = f.id
      WHERE f.id = $1
      ORDER BY s.id ASC NULLS LAST
      `,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Function not found' });

    if (output === 'csv') {
      const header = Object.keys(rows[0]).join(',');
      const csv = [
        header,
        ...rows.map(r =>
          Object.values(r)
            .map(v => (v == null ? '' : `"${String(v).replace(/"/g, '""')}"`))
            .join(',')
        ),
      ].join('\n');
      res.header('Content-Type', 'text/csv');
      res.attachment(`function_${id}_run_sheet.csv`);
      return res.send(csv);
    }

    return res.json(rows);
  } catch (err) {
    console.error('Error fetching run sheet:', err);
    return res.status(500).json({ error: 'Failed to fetch run sheet' });
  }
});

/* ============================================================================
   SAVE-ALL (transactional)
============================================================================ */

/**
 * POST /api/functions/:id/save-all
 */
router.post('/:id/save-all', async (req, res) => {
  const { id } = req.params;
  const { core = {}, services = {}, menus = {} } = req.body || {};
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1) Update core fields
    const coreMap = {
      event_name:      toText(core.event_name),
      room:            toText(core.room),
      attendees:       toInt(core.attendees),
      catering:        toBool(core.catering),
      bar_service:     toBool(core.bar_service),
      bar_type:        toText(core.bar_type),
      bar_tab_amount:  toNumericOrNull(core.bar_tab_amount),
      bar_notes:       toText(core.bar_notes),
      notes:           toText(core.notes),
      event_date:      toDateOrNull(core.event_date),
      event_time:      toTimeOrNull(core.event_time),
      ...(core.status !== undefined
        ? { status: ALLOWED_STATUS.has(String(core.status).toLowerCase()) ? String(core.status).toLowerCase() : null }
        : {})
    };

    const setCols = [];
    const setVals = [];
    let i = 1;
    for (const [k, v] of Object.entries(coreMap)) {
      if (v !== undefined) { setCols.push(`${k} = $${i++}`); setVals.push(v); }
    }
    if (setCols.length) {
      const { rowCount } = await client.query(
        `UPDATE functions SET ${setCols.join(', ')} WHERE id=$${i}`,
        [...setVals, id]
      );
      if (!rowCount) throw new Error('Function not found');
    }

    // 2) Services
    const svc = {
      deletes: Array.isArray(services.deletes) ? services.deletes : [],
      updates: Array.isArray(services.updates) ? services.updates : [],
      creates: Array.isArray(services.creates) ? services.creates : [],
    };

    for (const delId of svc.deletes) {
      await client.query(`DELETE FROM services WHERE id=$1 AND function_id=$2`, [toInt(delId), id]);
    }
    for (const u of svc.updates) {
      if (!u || !u.id) continue;
      const fields = [];
      const values = [];
      let j = 1;
      if (u.service_name !== undefined) {
        const sv = toText(u.service_name);
        if (sv !== null) { fields.push(`service_name=$${j++}`); values.push(sv); }
      }
      if (u.qty   !== undefined) { fields.push(`qty=$${j++}`);   values.push(toInt(u.qty)); }
      if (u.price !== undefined) { fields.push(`price=$${j++}`); values.push(toNumericOrNull(u.price)); }
      if (u.notes !== undefined) { fields.push(`notes=$${j++}`); values.push(toText(u.notes)); }
      if (!fields.length) continue;
      values.push(toInt(u.id), id);
      await client.query(
        `UPDATE services SET ${fields.join(', ')} WHERE id=$${j++} AND function_id=$${j}`,
        values
      );
    }
    for (const c of svc.creates) {
      if (!c || !toText(c.service_name)) continue;
      await client.query(
        `INSERT INTO services (function_id, service_name, qty, price, notes)
         VALUES ($1,$2,$3,$4,$5)`,
        [id, toText(c.service_name), toInt(c.qty), toNumericOrNull(c.price), toText(c.notes)]
      );
    }

    // 3) Menus
    const men = {
      deletes: Array.isArray(menus.deletes) ? menus.deletes : [],
      updates: Array.isArray(menus.updates) ? menus.updates : [],
      creates: Array.isArray(menus.creates) ? menus.creates : [],
    };

    for (const delMenuId of men.deletes) {
      await client.query(
        `DELETE FROM function_menus WHERE function_id=$1 AND menu_id=$2`,
        [id, toInt(delMenuId)]
      );
    }
    for (const u of men.updates) {
      if (!u || !u.menu_id) continue;
      const fields = [];
      const values = [];
      let j = 1;
      if (u.qty   !== undefined) { fields.push(`qty=$${j++}`);   values.push(toInt(u.qty)); }
      if (u.notes !== undefined) { fields.push(`notes=$${j++}`); values.push(toText(u.notes)); }
      if (u.price !== undefined) { fields.push(`price=$${j++}`); values.push(toNumericOrNull(u.price)); }
      if (fields.length) {
        values.push(id, toInt(u.menu_id));
        await client.query(
          `UPDATE function_menus SET ${fields.join(', ')} WHERE function_id=$${j++} AND menu_id=$${j}`,
          values
        );
      }
      if (u.update_base_price && u.price !== undefined) {
        await client.query(`UPDATE menus SET price=$1 WHERE id=$2`, [toNumericOrNull(u.price), toInt(u.menu_id)]);
      }
    }
    for (const c of men.creates) {
      if (!c || !c.menu_id) continue;
      await client.query(
        `INSERT INTO function_menus (function_id, menu_id, qty, notes, price)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (function_id, menu_id) DO UPDATE
           SET qty   = EXCLUDED.qty,
               notes = EXCLUDED.notes,
               price = EXCLUDED.price`,
        [id, toInt(c.menu_id), toInt(c.qty), toText(c.notes), toNumericOrNull(c.price)]
      );
      if (c.update_base_price && c.price !== undefined) {
        await client.query(`UPDATE menus SET price=$1 WHERE id=$2`, [toNumericOrNull(c.price), toInt(c.menu_id)]);
      }
    }

    await client.query('COMMIT');

    const fnRes = await pool.query(
      `SELECT f.*, ${startsAtSql} AS starts_at FROM functions f WHERE f.id=$1`,
      [id]
    );
    const svcRes = await pool.query(
      `SELECT id, service_name, qty, price, notes FROM services WHERE function_id=$1 ORDER BY id`,
      [id]
    );
    const menuRes = await pool.query(
      `SELECT fm.menu_id, fm.qty, fm.notes, fm.price, m.name, m.price AS base_price, m.serves
       FROM function_menus fm
       JOIN menus m ON m.id = fm.menu_id
       WHERE fm.function_id=$1
       ORDER BY m.name`,
      [id]
    );

    return res.json({
      ok: true,
      function: fnRes.rows[0],
      services: svcRes.rows,
      menus: menuRes.rows
    });
  } catch (err) {
    try { await pool.query('ROLLBACK'); } catch {}
    console.error('save-all error:', err);
    return res.status(500).json({ error: 'Save failed', detail: err.message });
  }
});

/* ============================================================================
   STATUS ONLY + helpers
============================================================================ */

/**
 * PATCH /api/functions/:id/status
 */
router.patch('/:id/status', async (req, res) => {
  const { id } = req.params;
  const status = String(req.body.status || '').toLowerCase();
  if (!ALLOWED_STATUS.has(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  try {
    const { rows } = await pool.query(
      `UPDATE functions SET status=$1 WHERE id=$2 RETURNING id, status`,
      [status, id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Function not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Update function status error:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

/**
 * POST /api/functions/:id/confirm  → sets status=confirmed
 */
router.post('/:id/confirm', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `UPDATE functions SET status='confirmed' WHERE id=$1 RETURNING id, status`,
      [id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Function not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Confirm function error:', err);
    res.status(500).json({ error: 'Failed to confirm function' });
  }
});

/**
 * POST /api/functions/:id/cancel   → sets status=cancelled
 */
router.post('/:id/cancel', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `UPDATE functions SET status='cancelled' WHERE id=$1 RETURNING id, status`,
      [id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Function not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Cancel function error:', err);
    res.status(500).json({ error: 'Failed to cancel function' });
  }
});

/* ============================================================================
   SERVER-RENDERED EDIT VIEW (for the Dashboard "Edit" button)
   NOTE: If this router is mounted at '/api/functions', your edit URL will be
   '/api/functions/:id/edit'. Either:
     1) Change the Edit link to that, OR
     2) Also mount this router at '/functions' in app.js so '/functions/:id/edit' works.
============================================================================ */
router.get('/:id/edit', async (req, res) => {
  try {
    const { id } = req.params;

    // Load core
    const { rows: fnRows } = await pool.query(
      `SELECT f.*, ${startsAtSql} AS starts_at,
              b.name AS contact_name, b.email AS contact_email, b.phone AS contact_phone
       FROM functions f
       LEFT JOIN bookings b ON b.id = f.booking_id
       WHERE f.id=$1`,
      [id]
    );
    if (!fnRows[0]) return res.status(404).send('Function not found');

    const { rows: svcRows } = await pool.query(
      `SELECT id, service_name, qty, price, notes
       FROM services WHERE function_id=$1 ORDER BY id`,
      [id]
    );
    const { rows: menuRows } = await pool.query(
      `SELECT m.id AS menu_id, m.name, m.price AS base_price, m.serves,
              fm.qty, fm.notes, fm.price AS override_price
       FROM function_menus fm
       JOIN menus m ON m.id = fm.menu_id
       WHERE fm.function_id=$1
       ORDER BY m.name`,
      [id]
    );

    // Render EJS (ensure views path is Uppercase: "views/pages/functions/edit.ejs")
    return res.render('pages/functions/edit', {
      fn: fnRows[0],
      services: svcRows,
      menus: menuRows
    });
  } catch (err) {
    console.error('render edit error:', err);
    return res.status(500).send('Failed to load edit view');
  }
});

/* ============================================================================
   Helpers
============================================================================ */
function toInt(v) {
  return v !== undefined && v !== null && !Number.isNaN(Number(v)) ? parseInt(v, 10) : null;
}
function toNumericOrNull(v) {
  return v !== undefined && v !== null && !Number.isNaN(Number(v)) ? Number(v) : null;
}
function toText(v) {
  return v !== undefined && v !== null && String(v).trim() !== '' ? String(v).trim() : null;
}
function toBool(v) {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return ['1', 'true', 'on', 'yes'].includes(v.toLowerCase());
  return null;
}
function toDateOrNull(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : format(d, 'yyyy-MM-dd');
}
function toTimeOrNull(v) {
  if (!v) return null;
  const m = String(v).match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  return `${m[1]}:${m[2]}:${m[3] || '00'}`;
}

module.exports = router;
