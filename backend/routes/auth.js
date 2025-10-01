// backend/routes/auth.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const pool = require("../db");

// ---------- Auth Pages ----------

// Register form
router.get("/register", (req, res) => {
  return res.render("register");
});

// Register staff
router.post("/register", async (req, res) => {
  const { name, email, phone, username, password, role } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO public.users (name, email, phone, username, password_hash, role)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [name, email, phone || null, username, hash, role || "staff"]
    );

    return res.redirect("/login");
  } catch (err) {
    console.error("[Register error]", err);

    if (err.code === "23505" && err.detail) {
      if (err.detail.includes("email")) {
        return res.status(400).send("Email is already registered");
      }
      if (err.detail.includes("username")) {
        return res.status(400).send("Username is already taken");
      }
    }

    return res.status(500).send("Failed to register user");
  }
});

// Login form
router.get("/login", (req, res) => {
  return res.render("login");
});

// Login submit
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const { rows } = await pool.query(
      `SELECT * FROM public.users WHERE username=$1`,
      [username]
    );

    if (!rows[0]) {
      return res.status(401).send("Invalid username or password");
    }

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).send("Invalid username or password");
    }

    // Attach to session
    req.session.user = {
      id: user.id,
      name: user.name,
      role: user.role,
    };

    console.log(`[auth] User ${user.username} logged in as ${user.role}`);
    return res.redirect("/dashboard");
  } catch (err) {
    console.error("[Login error]", err); // full error object, not just message
    return res.status(500).send("Login failed");
  }
});

// Logout
router.get("/logout", (req, res) => {
  req.session?.destroy(() => res.redirect("/login"));
});

module.exports = router;
