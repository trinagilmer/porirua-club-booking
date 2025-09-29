const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST /api/catalog/menus
router.post('/menus', async (req, res) => {
  const { name, price, serves, notes } = req.body;

  if (!name || price == null || serves == null) {
    return res.status(400).json({ error: 'name, price, serves required' });
  }

  const p = Number(price);
  const s = parseInt(serves, 10);
  if (Number.isNaN(p) || Number.isNaN(s)) {
    return res.status(400).json({ error: 'price and serves must be numbers' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO menus (name, price, serves, notes)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [String(name).trim(), p, s, (notes ?? '').trim() || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Add menu error:', err);
    res.status(500).json({ error: 'Failed to add menu' });
  }
});

// POST /api/catalog/services
router.post('/services', async (req, res) => {
  const { name, price, notes } = req.body;

  if (!name || String(name).trim() === '') {
    return res.status(400).json({ error: 'name required' });
  }

  const p = price == null || price === '' ? null : Number(price);
  if (p !== null && Number.isNaN(p)) {
    return res.status(400).json({ error: 'price must be a number' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO service_catalog (name, price, notes)
       VALUES ($1,$2,$3)
       RETURNING *`,
      [String(name).trim(), p, (notes ?? '').trim() || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Add service error:', err);
    res.status(500).json({ error: 'Failed to add service' });
  }
});

module.exports = router;

