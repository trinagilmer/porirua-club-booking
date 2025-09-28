// middleware/authMiddleware.js
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

module.exports = { requireLogin, requireAdmin };
