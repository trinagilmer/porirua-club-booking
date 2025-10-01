// backend/app.js
const path = require('path');
const express = require('express');
const session = require('express-session');
const auditRoutes = require("./routes/audit");
const dashboardRoutes = require("./routes/dashboard");

// Load env from backend/.env (hosted platforms use their own env panel)
require('dotenv').config({ path: path.join(__dirname, '.env') });
// backend/app.js
require('dotenv').config({ path: path.join(__dirname, '.env') });

// TEMP: allow self-signed certs in staging if explicitly enabled
if (String(process.env.ALLOW_SELF_SIGNED_TLS || '').toLowerCase() === 'true') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const app = express();
console.log('[app] booting…');

// Trust proxy when running behind a load balancer (Render, etc.)
if (process.env.TRUST_PROXY || process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// ---- Views (EJS) ----
// Your repo uses capitalised folders: backend/Views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'Views'));

// ---- Static assets ----
// Your repo uses backend/Public (capital P) for /css/main.css etc.
app.use(express.static(path.join(__dirname, 'Public')));

// ---- Core middleware ----
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---- Sessions ----
app.use(
  session({
    name: process.env.SESSION_NAME || 'pcb.sid',
    secret: process.env.SESSION_SECRET || 'dev-only-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: 'auto',
      maxAge: parseInt(process.env.SESSION_TTL_MS || `${1000 * 60 * 60 * 8}`, 10),
    },
  })
);


// Expose session user to views as `user`
app.use((req, res, next) => {
  res.locals.user = req.session?.user || null;
  next();
});

// 🔑 DB Context Middleware — sets actor_id for audit logs
const pool = require('./db');
app.use(async (req, res, next) => {
  try {
    if (req.session?.user?.id) {
      await pool.query('SET LOCAL app.current_user_id = $1', [req.session.user.id]);
    } else {
      // Optional fallback: -1 = system/anon
      await pool.query('SET LOCAL app.current_user_id = -1');
    }
    next();
  } catch (err) {
    console.error('[dbContext] error:', err);
    next(err);
  }
});


// ---- Routes (each exports an Express Router) ----
const authRoutes        = require('./routes/auth');
const bookingRoutes     = require('./routes/booking');
const functionRoutes    = require('./routes/functions');
const calendarRoutes    = require('./routes/calendar');
const staffFunctions    = require('./routes/staffFunctions');
const staffBookings     = require('./routes/staffBookings');
const staffCalendar     = require('./routes/staffCalendar');

// Optional feature routes
let catalogRoutes = null;
let taskRoutes = null;
try { catalogRoutes = require('./routes/catalog'); } catch {}
try { taskRoutes    = require('./routes/tasks');   } catch {}

// Auth middleware (your file lives in backend/Middleware/authMiddleware.js)
const { requireLogin } = require('./Middleware/authMiddleware');

// ---- Public/API ----
app.use('/', authRoutes); // includes /login, /register, maybe /dashboard in that file
app.use('/api/bookings', bookingRoutes);
app.use('/api/functions', functionRoutes);
app.use('/api/calendar', calendarRoutes);

// ---- Staff (protected) ----
app.use('/staff/calendar',  requireLogin, staffCalendar);
app.use('/staff/functions', requireLogin, staffFunctions);
app.use('/staff/bookings',  requireLogin, staffBookings);

// Optional protected APIs
if (catalogRoutes) app.use('/api/catalog', requireLogin, catalogRoutes);
if (taskRoutes)    app.use('/api/tasks',   requireLogin, taskRoutes);

// ---- Dashboard (protected) ----
const dashboardRoutes = require("./routes/dashboard");
app.use("/dashboard", dashboardRoutes);

// ---- Admin-only audit feed ----
const auditRoutes = require("./routes/audit");
app.use("/admin/audit", auditRoutes);

// ---- Health ----
app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/healthz', (_req, res) => res.json({ ok: true })); //

// Friendly home redirect
app.get('/', (req, res) => {
  if (req.session?.user) return res.redirect('/dashboard');
  return res.redirect('/login');
});
// ---- 404 ----
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// ---- Error handler ----
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[error]', err);
  res.status(err.status || 500).json({ error: 'Server error', detail: err.message });
});

// ---- Start server only if run directly ----
if (require.main === module) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
}

module.exports = app;


