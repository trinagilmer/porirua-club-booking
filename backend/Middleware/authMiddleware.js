// middleware/authMiddleware.js
const pool = require("../db"); // adjust if your db.js is elsewhere

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login"); // redirect staff to login
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).send("Access denied: Admins only");
  }
  next();
}

// 🔑 New middleware: set Postgres session variable for auditing
async function setDbUserContext(req, res, next) {
  try {
    if (req.session.user) {
      const userId = req.session.user.id;

      // Ensure this runs in the same transaction/session
      await pool.query("SET LOCAL app.current_user_id = $1", [userId]);
    }
    next();
  } catch (err) {
    console.error("Error setting DB user context:", err);
    next(err);
  }
}

module.exports = { requireLogin, requireAdmin, setDbUserContext };

