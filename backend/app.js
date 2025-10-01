// backend/app.js
const path = require("path");
const express = require("express");
const session = require("express-session");

// Routes
const authRoutes = require("./routes/auth");
const bookingRoutes = require("./routes/booking");
const functionRoutes = require("./routes/functions");
const calendarRoutes = require("./routes/calendar");
const staffFunctions = require("./routes/staffFunctions");
const staffBookings = require("./routes/staffBookings");
const staffCalendar = require("./routes/staffCalendar");
const catalogRoutes = safeRequire("./routes/catalog");
const taskRoutes = safeRequire("./routes/tasks");
const auditRoutes = require("./routes/audit");
const dashboardRoutes = require("./routes/dashboard");

// Middleware
const { requireLogin } = require("./Middleware/authMiddleware");
const pool = require("./db");

// Load env
require("dotenv").config({ path: path.join(__dirname, ".env") });

// TEMP: allow self-signed certs in staging if explicitly enabled
if (String(process.env.ALLOW_SELF_SIGNED_TLS || "").toLowerCase() === "true") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const app = express();
console.log("[app] booting…");

// Trust proxy when running behind a load balancer (Render, etc.)
if (process.env.TRUST_PROXY || process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// ---- Views (EJS) ----
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "Views"));

// ---- Static assets ----
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
      secure: "auto", // auto-secure in HTTPS
      maxAge: parseInt(
        process.env.SESSION_TTL_MS || `${1000 * 60 * 60 * 8}`,
        10
      ), // 8h
    },
  })
);

// Expose session user to views as `user`
app.use((req, res, next) => {
  res.locals.user = req.session?.user || null;
  next();
});

// ---- DB health ----
app.get("/db/health", async (_req, res) => {
  try {
    const { rows } = await pool.query("select now() as now");
    res.json({ ok: true, now: rows[0].now });
  } catch (e) {
    console.error("[db/health] error:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ---- Routes ----
app.use("/", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/functions", functionRoutes);
app.use("/api/calendar", calendarRoutes);

// Staff (protected)
app.use("/staff/calendar", requireLogin, staffCalendar);
app.use("/staff/functions", requireLogin, staffFunctions);
app.use("/staff/bookings", requireLogin, staffBookings);

// Optional APIs
if (catalogRoutes) app.use("/api/catalog", requireLogin, catalogRoutes);
if (taskRoutes) app.use("/api/tasks", requireLogin, taskRoutes);

// Audit + Dashboard
app.use("/admin/audit", auditRoutes);
app.use("/dashboard", dashboardRoutes);

// ---- Health ----
app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/healthz", (_req, res) => res.json({ ok: true }));

// Home redirect
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

// ---- Start server only if run directly ----
if (require.main === module) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () =>
    console.log(`Backend running on http://localhost:${PORT}`)
  );
}

module.exports = app;

// Utility to safely require optional routes
function safeRequire(path) {
  try {
    return require(path);
  } catch {
    return null;
  }
}
