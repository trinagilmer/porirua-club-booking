// backend/app.js

const path = require("path");

// ---- Load env FIRST ----
require("dotenv").config({ path: path.join(__dirname, ".env") });
console.log("[env] DATABASE_URL:", process.env.DATABASE_URL);

// ---- Core imports ----
const express = require("express");
const session = require("express-session");

// Middleware
const { requireLogin } = require("./Middleware/authMiddleware");

// DB
const pool = require("./db");


// Utility: safely load optional routes
function safeRequire(p) {
  try {
    return require(p);
  } catch {
    return null;
  }
}

const app = express();
console.log("[app] Booting…");

// ---- Express settings ----
if (process.env.TRUST_PROXY || process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1); // trust proxy (needed on Render/Heroku etc.)
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "Views"));
app.use(express.static(path.join(__dirname, "Public")));

// ---- Core middleware ----
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---- Sessions ----
app.use(
  session({
    name: process.env.SESSION_NAME || "pcb.sid",
    secret: process.env.SESSION_SECRET || "dev-only-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: "auto", // only secure in HTTPS
      maxAge: parseInt(
        process.env.SESSION_TTL_MS || `${1000 * 60 * 60 * 8}`, // default 8h
        10
      ),
    },
  })
);

// Expose session user in all views as `user`
app.use((req, res, next) => {
  res.locals.user = req.session?.user || null;
  next();
});

// ---- Routes ----
const authRoutes = require("./routes/auth");
const bookingRoutes = require("./routes/booking");
const functionRoutes = require("./routes/functions");
const calendarRoutes = require("./routes/calendar");
const staffFunctions = require("./routes/staffFunctions");
const staffBookings = require("./routes/staffBookings");
const staffCalendar = require("./routes/staffCalendar");
const auditRoutes = require("./routes/audit");
const dashboardRoutes = require("./routes/dashboard");

// Optional routes
const catalogRoutes = safeRequire("./routes/catalog");
const taskRoutes = safeRequire("./routes/tasks");

// Core APIs
app.use("/", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/functions", functionRoutes);
app.use("/api/calendar", calendarRoutes);

// Staff (protected)
app.use("/staff/calendar", requireLogin, staffCalendar);
app.use("/staff/functions", requireLogin, staffFunctions);
app.use("/staff/bookings", requireLogin, staffBookings);

// Optional APIs (only load if files exist)
if (catalogRoutes) app.use("/api/catalog", requireLogin, catalogRoutes);
if (taskRoutes) app.use("/api/tasks", requireLogin, taskRoutes);

// Audit + Dashboard
app.use("/admin/audit", auditRoutes);
app.use("/dashboard", requireLogin, dashboardRoutes); // 🔒 protected

// ---- Health checks ----
app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/healthz", (_req, res) => res.json({ ok: true }));

// Database health check
app.get("/db/health", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT now() AS now");
    res.json({ ok: true, now: rows[0].now });
  } catch (err) {
    console.error("[db/health] error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ---- Root redirect ----
app.get("/", (req, res) => {
  if (req.session?.user) return res.redirect("/dashboard");
  return res.redirect("/login");
});

// ---- 404 ----
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// ---- Error handler ----
app.use((err, _req, res, _next) => {
  console.error("[error]", err);
  res.status(err.status || 500).json({
    error: "Server error",
    detail: err.message,
  });
});

// ---- Start server (only if run directly) ----
if (require.main === module) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`✅ Backend running on http://localhost:${PORT}`);
  });
}

module.exports = app;


