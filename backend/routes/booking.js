const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET all bookings
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM bookings ORDER BY datetime ASC");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching bookings:", err.message);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

// POST new booking
router.post("/", async (req, res) => {
  const { name, email, phone, type, guests, datetime } = req.body;

  if (!name || !email || !type || !datetime) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO bookings (name, email, phone, type, guests, datetime, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING *`,
      [name, email, phone, type, guests, datetime]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error inserting booking:", err.message);
    res.status(500).json({ error: "Database insert failed" });
  }
});

module.exports = router;
