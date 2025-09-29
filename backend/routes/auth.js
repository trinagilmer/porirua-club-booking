// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../db');

// ---------- Auth Pages ----------

// Register form
router.get('/register', (req, res) => {
  return res.render('register'); // views/register.ejs
});

// Register staff
router.post('/register', async (req, res) => {
  const { name, email, phone, username, password, role } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO users (name, email, phone, username, password_hash, role)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [name, email, phone || null, username, hash, role || 'staff']
    );
    return res.redirect('/login');
  } catch (err) {
    console.error('Register error:', err.message);
    if (err.code === '23505' && err.detail) {
      if (err.detail.includes('email')) {
        return res.status(400).send('Email is already registered');
      }
      if (err.detail.includes('username')) {
        return res.status(400).send('Username is already taken');
      }
    }
    return res.status(500).send('Failed to register user');
  }
});

// Login form
router.get('/login', (req, res) => {
  return res.render('login'); // views/login.ejs
});

// Login submit
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const { rows } = await pool.query(`SELECT * FROM users WHERE username=$1`, [username]);
    if (!rows[0]) return res.status(401).send('Invalid username or password');

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).send('Invalid username or password');

    req.session.user = { id: user.id, name: user.name, role: user.role };
    return res.redirect('/dashboard');
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).send('Login failed');
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session?.destroy(() => res.redirect('/login'));
});


// ---------- Dashboard ----------
// KPIs (confirmed value/count), upcoming functions, tasks, with date filter
const { format, startOfMonth, endOfMonth } = require('date-fns');

router.get('/dashboard', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  // Accept ?start=YYYY-MM-DD&end=YYYY-MM-DD (treated as local dates)
  const todayLocal = new Date();
  const startLocal = req.query.start ? new Date(`${req.query.start}T00:00:00`) : startOfMonth(todayLocal);
  const endLocal   = req.query.end   ? new Date(`${req.query.end}T23:59:59`)   : endOfMonth(todayLocal);

  const startStr = format(startLocal, 'yyyy-MM-dd');
  const endStr   = format(endLocal,   'yyyy-MM-dd');

  try {
    // KPI: sum of menus + services for confirmed functions in period
    const qKpi = `
      WITH sums AS (
        SELECT
          f.id,
          COALESCE(mt.menus_total, 0) + COALESCE(st.services_total, 0) AS total_value,
          LOWER(COALESCE(f.status, b.status, 'pending')) AS eff_status,
          COALESCE(f.event_date::date, f.created_at::date) AS d_date
        FROM functions f
        LEFT JOIN bookings b ON b.id = f.booking_id
        LEFT JOIN (
          SELECT fm.function_id, SUM(fm.qty * COALESCE(m.price, 0)) AS menus_total
          FROM function_menus fm
          JOIN menus m ON m.id = fm.menu_id
          GROUP BY fm.function_id
        ) mt ON mt.function_id = f.id
        LEFT JOIN (
          SELECT s.function_id, SUM(s.qty * COALESCE(s.price, 0)) AS services_total
          FROM services s
          GROUP BY s.function_id
        ) st ON st.function_id = f.id
        WHERE COALESCE(f.event_date::date, f.created_at::date) BETWEEN $1::date AND $2::date
      )
      SELECT
        COALESCE(SUM(total_value) FILTER (WHERE eff_status = 'confirmed'), 0) AS confirmed_value,
        COUNT(*) FILTER (WHERE eff_status = 'confirmed') AS confirmed_count,
        COUNT(*) FILTER (WHERE eff_status = 'pending')   AS pending_count,
        COUNT(*) FILTER (WHERE eff_status = 'lead')      AS lead_count
      FROM sums;
    `;
    const { rows: kpiRows } = await pool.query(qKpi, [startStr, endStr]);
    const kpi = kpiRows[0] || { confirmed_value: 0, confirmed_count: 0, pending_count: 0, lead_count: 0 };

    // Upcoming functions (in period) with computed totals
    const qUpcoming = `
      WITH line_totals AS (
        SELECT f.id,
               COALESCE(mt.menus_total, 0) + COALESCE(st.services_total, 0) AS total_value
        FROM functions f
        LEFT JOIN (
          SELECT fm.function_id, SUM(fm.qty * COALESCE(m.price, 0)) AS menus_total
          FROM function_menus fm
          JOIN menus m ON m.id = fm.menu_id
          GROUP BY fm.function_id
        ) mt ON mt.function_id = f.id
        LEFT JOIN (
          SELECT s.function_id, SUM(s.qty * COALESCE(s.price, 0)) AS services_total
          FROM services s
          GROUP BY s.function_id
        ) st ON st.function_id = f.id
      )
      SELECT
        f.id, f.event_name, f.room, f.attendees,
        COALESCE(f.event_date::date, f.created_at::date) AS d_date,
        LOWER(COALESCE(f.status, b.status, 'pending')) AS status,
        COALESCE(lt.total_value, 0) AS total_value
      FROM functions f
      LEFT JOIN bookings b ON b.id = f.booking_id
      LEFT JOIN line_totals lt ON lt.id = f.id
      WHERE COALESCE(f.event_date::date, f.created_at::date) BETWEEN $1::date AND $2::date
      ORDER BY COALESCE(f.event_date::date, f.created_at::date) ASC, f.id ASC
      LIMIT 10;
    `;
    const { rows: upcoming } = await pool.query(qUpcoming, [startStr, endStr]);

    // Open tasks (top 10) — optional table; ignore if it doesn't exist
    const qTasks = `
      SELECT t.id, t.title, t.status, t.due_date,
             u.name AS assignee
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assignee_id
      WHERE LOWER(t.status) = 'open'
      ORDER BY t.due_date NULLS LAST, t.id ASC
      LIMIT 10;
    `;
    let tasks = [];
    try {
      const { rows } = await pool.query(qTasks);
      tasks = rows;
    } catch {
      tasks = []; // no tasks table yet; ignore
    }

    return res.render('Pages/dashboard', {
      user: req.session.user,
      start: startStr,
      end: endStr,
      kpi,
      upcoming,
      tasks,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return res.status(500).send('Failed to load dashboard');
  }
});

module.exports = router;
