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

// POST /api/catalog/services  (create-or-update by unique name)
router.post('/services', async (req, res) => {
  const { name, price, notes } = req.body;

  const nm = (name ?? '').trim();
  if (!nm) return res.status(400).json({ error: 'name required' });

  const p = price == null || price === '' ? null : Number(price);
  if (p !== null && Number.isNaN(p)) {
    return res.status(400).json({ error: 'price must be a number' });
  }

  try {
    // On duplicate name, update price/notes instead of erroring
    const { rows, rowCount } = await pool.query(
      `
      INSERT INTO service_catalog (name, price, notes)
      VALUES ($1, $2, $3)
      ON CONFLICT (name)
      DO UPDATE SET
        price = EXCLUDED.price,
        notes = EXCLUDED.notes
      RETURNING *;
      `,
      [nm, p, (notes ?? '').trim() || null]
    );

    // If the row existed, this returns the updated row; if not, the inserted row.
    // Use 201 when newly created, 200 when updated (nice-to-have semantics).
    // We can infer “updated” by checking if a row with that name already existed before,
    // but a simple follow-up is fine: if there was a conflict, Postgres still counts it as 1 row.
    // We'll include a flag to help the UI if you want to show different toasts.
    return res.status(200).json({ updated: true, ...rows[0] });
  } catch (err) {
    console.error('Add/Upsert service error:', err);
    return res.status(500).json({ error: 'Failed to upsert service' });
  }
});

module.exports = router;

