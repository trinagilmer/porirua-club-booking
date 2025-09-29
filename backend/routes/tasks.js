const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST /api/tasks  (create)
router.post('/', async (req, res) => {
  const { title, due_date, assignee_id } = req.body;
  if (!title || String(title).trim() === '') {
    return res.status(400).json({ error: 'title required' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO tasks (title, due_date, assignee_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [String(title).trim(), due_date || null, assignee_id || null]
    );
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create task error:', err);
    return res.status(500).json({ error: 'Failed to create task' });
  }
});

// PATCH /api/tasks/:id  (update or mark done)
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { status, title, due_date, assignee_id } = req.body;

  try {
    const fields = [];
    const vals = [];
    let i = 1;

    if (status !== undefined)     { fields.push(`status = $${i++}`);      vals.push(String(status)); }
    if (title !== undefined)      { fields.push(`title = $${i++}`);       vals.push(String(title)); }
    if (due_date !== undefined)   { fields.push(`due_date = $${i++}`);    vals.push(due_date || null); }
    if (assignee_id !== undefined){ fields.push(`assignee_id = $${i++}`); vals.push(assignee_id || null); }

    if (!fields.length) {
      const q = await pool.query(`SELECT * FROM tasks WHERE id=$1`, [id]);
      if (!q.rows[0]) return res.status(404).json({ error: 'Task not found' });
      return res.json(q.rows[0]);
    }

    vals.push(id);
    const { rows } = await pool.query(
      `UPDATE tasks SET ${fields.join(', ')} WHERE id=$${i} RETURNING *`,
      vals
    );
    if (!rows[0]) return res.status(404).json({ error: 'Task not found' });
    return res.json(rows[0]);
  } catch (err) {
    console.error('Update task error:', err);
    return res.status(500).json({ error: 'Failed to update task' });
  }
});

module.exports = router;
