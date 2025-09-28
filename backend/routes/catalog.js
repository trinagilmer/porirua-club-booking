const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireLogin } = require('../middleware/authMiddleware');

// POST /api/catalog/menus
router.post('/menus', requireLogin, async (req, res) => {
  const { name, price, serves, notes } = req.body;
  if (!name || price == null || serves == null) {
    return res.status(400).json({ error: 'name, price, serves required' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO menus (name, price, serves, notes) VALUES ($1,$2,$3,$4) RETURNING *`,
      [name, price, serves, notes || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Add menu error:', err.message);
    res.status(500).json({ error: 'Failed to add menu' });
  }
});

// POST /api/catalog/services
router.post('/services', requireLogin, async (req, res) => {
  const { name, price, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO service_catalog (name, price, notes) VALUES ($1,$2,$3) RETURNING *`,
      [name, price ?? null, notes || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Add service error:', err.message);
    res.status(500).json({ error: 'Failed to add service' });
  }
});

module.exports = router;
