// backend/routes/staffFunctions.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

const NZ_TZ = 'Pacific/Auckland';

/**
 * LIST — /staff/functions
 * Renders: views/pages/functionsList.ejs
 */
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `
      WITH mt AS (
        SELECT fm.function_id, SUM(fm.qty * COALESCE(m.price,0)) AS menus_total
        FROM function_menus fm
        JOIN menus m ON m.id = fm.menu_id
        GROUP BY fm.function_id
      ),
      st AS (
        SELECT s.function_id, SUM(s.qty * COALESCE(s.price,0)) AS services_total
        FROM services s
        GROUP BY s.function_id
      )
      SELECT
        f.id,
        f.event_name,
        f.room,
        f.attendees,
        LOWER(COALESCE(f.status, 'confirmed')) AS status,
        COALESCE(mt.menus_total,0) + COALESCE(st.services_total,0) AS total_value,
        /* Bucket to NZ local day for filtering/sorting */
        COALESCE(f.event_date::date, (f.created_at AT TIME ZONE $1)::date) AS nz_day,
        b.name  AS contact_name,
        b.phone AS contact_phone
      FROM functions f
      LEFT JOIN bookings b ON b.id = f.booking_id
      LEFT JOIN mt ON mt.function_id = f.id
      LEFT JOIN st ON st.function_id = f.id
      ORDER BY nz_day ASC NULLS LAST, f.id ASC
      `,
      [NZ_TZ]
    );

    return res.render('pages/functionsList', {
      functions: rows,
      user: req.session.user || null
    });
  } catch (err) {
    console.error('[functions:list] error:', err);
    return res.status(500).send('Failed to load functions');
  }
});

// GET /staff/functions/:id/detail  → server-rendered detail page
router.get('/:id/detail', async (req, res) => {
  const { id } = req.params;

  try {
    // Function + contact
    const { rows: fnRows } = await pool.query(
      `
      SELECT
        f.*,
        b.name  AS contact_name,
        b.phone AS contact_phone,
        b.email AS contact_email
      FROM functions f
      LEFT JOIN bookings b ON b.id = f.booking_id
      WHERE f.id = $1
      `,
      [id]
    );
    if (!fnRows[0]) return res.status(404).send('Function not found');
    const fn = fnRows[0];

    // Menus on this function
    const { rows: menus } = await pool.query(
      `
      SELECT
        fm.menu_id,
        m.name,
        fm.qty,
        COALESCE(fm.price, m.price, 0) AS price,
        fm.notes
      FROM function_menus fm
      JOIN menus m ON m.id = fm.menu_id
      WHERE fm.function_id = $1
      ORDER BY m.name ASC
      `,
      [id]
    );

    // Services on this function
    const { rows: services } = await pool.query(
      `
      SELECT id, service_name, qty, price, notes
      FROM services
      WHERE function_id = $1
      ORDER BY service_name ASC NULLS LAST, id ASC
      `,
      [id]
    );

    // ---- Totals for the view
    const menuTotal = menus.reduce(
      (sum, m) => sum + (Number(m.qty || 0) * Number(m.price || 0)),
      0
    );
    const svcTotal = services.reduce(
      (sum, s) => sum + (Number(s.qty || 0) * Number(s.price || 0)),
      0
    );
    const totals = { menuTotal, svcTotal, total_value: menuTotal + svcTotal };

    // ---- Nice NZ date/time strings for the header line
    let dateStr = 'N/A';
    let timeStr = '';
    try {
      let startsAt = null;
      if (fn.event_date) {
        const hhmm = fn.event_time ? String(fn.event_time).slice(0, 5) : '00:00';
        startsAt = new Date(`${fn.event_date}T${hhmm}:00`);
      } else if (fn.created_at) {
        startsAt = new Date(fn.created_at);
      }
      if (startsAt && !Number.isNaN(startsAt.getTime())) {
        dateStr = startsAt.toLocaleDateString('en-NZ', {
          weekday: 'long', day: '2-digit', month: 'short', year: 'numeric'
        });
        timeStr = startsAt.toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' });
      }
    } catch (_) { /* fall back to defaults */ }

    return res.render('pages/functionDetail', {
      user: req.session.user || null,
      fn,
      menus,
      services,
      totals,      // <-- fixes "totals is not defined"
      dateStr,
      timeStr
    });
  } catch (err) {
    console.error('[functions:detail] error:', err);
    return res.status(500).send('Failed to load function detail');
  }
});


/**
 * EDIT — /staff/functions/:id/edit
 * Renders: views/pages/editFunction.ejs
 * (The page’s JS posts to /api/functions/:id/save-all — that’s handled by your API routes.)
 */
router.get('/:id/edit', async (req, res) => {
  const { id } = req.params;

  try {
    // Function
    const { rows: fnRows } = await pool.query(
      `
      SELECT
        f.*,
        b.name  AS contact_name,
        b.phone AS contact_phone,
        b.email AS contact_email
      FROM functions f
      LEFT JOIN bookings b ON b.id = f.booking_id
      WHERE f.id = $1
      `,
      [id]
    );
    if (!fnRows[0]) return res.status(404).send('Function not found');
    const fn = fnRows[0];

    // Current line items
    const { rows: menus } = await pool.query(
      `
      SELECT
        fm.menu_id,
        m.name,
        fm.qty,
        COALESCE(fm.price, m.price) AS price,
        fm.notes
      FROM function_menus fm
      JOIN menus m ON m.id = fm.menu_id
      WHERE fm.function_id = $1
      ORDER BY m.name ASC
      `,
      [id]
    );
    const { rows: services } = await pool.query(
      `
      SELECT id, service_name, qty, price, notes
      FROM services
      WHERE function_id = $1
      ORDER BY service_name ASC NULLS LAST, id ASC
      `,
      [id]
    );

    // Catalogs for dropdowns
    let allMenus = [];
    try {
      const { rows } = await pool.query(
        `SELECT id, name, price, serves, notes FROM menus ORDER BY name ASC`
      );
      allMenus = rows;
    } catch (e) {
      console.warn('[functions:edit] menus catalog not available:', e.message);
      allMenus = [];
    }

    let allServices = [];
    try {
      // Try common catalog table names; fall back to distinct services seen so far
      const candidates = [
        `SELECT name, price, notes FROM service_catalog ORDER BY name ASC`,
        `SELECT name, price, notes FROM services_catalog ORDER BY name ASC`
      ];
      let got = null;
      for (const sql of candidates) {
        try {
          const { rows } = await pool.query(sql);
          got = rows;
          break;
        } catch { /* try next */ }
      }
      if (!got) {
        const { rows } = await pool.query(
          `SELECT DISTINCT service_name AS name, NULL::numeric AS price, NULL::text AS notes
           FROM services WHERE service_name IS NOT NULL ORDER BY service_name ASC`
        );
        got = rows;
      }
      allServices = got;
    } catch (e) {
      console.warn('[functions:edit] services catalog not available:', e.message);
      allServices = [];
    }

    // Rooms list (optional table); provide a sensible fallback
    let rooms = [];
    try {
      const { rows } = await pool.query(`SELECT name FROM rooms ORDER BY name ASC`);
      rooms = rows;
    } catch {
      rooms = [{ name: 'Main Hall' }, { name: 'Lounge' }, { name: 'Conference Room' }];
    }

    return res.render('pages/editFunction', {
      fn,
      menus,
      services,
      allMenus,
      allServices,
      rooms,
      user: req.session.user || null
    });
  } catch (err) {
    console.error('[functions:edit] error:', err);
    return res.status(500).send('Failed to load function edit page');
  }
});

module.exports = router;






