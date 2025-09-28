const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireLogin } = require('../middleware/authMiddleware');

// POST /api/tasks
router.post('/', requireLogin, async (req, res) => {
  const { title, due_date, assignee_id } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO tasks (title, due_date, assignee_id, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [title, due_date || null, assignee_id || null, req.session.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create task error:', err.message);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PATCH /api/tasks/:id
router.patch('/:id', requireLogin, async (req, res) => {
  const { id } = req.params;
  const { status, title, due_date, assignee_id } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE tasks
         SET status     = COALESCE($1, status),
             title      = COALESCE($2, title),
             due_date   = COALESCE($3, due_date),
             assignee_id= COALESCE($4, assignee_id)
       WHERE id = $5
       RETURNING *`,
      [status || null, title || null, due_date || null, assignee_id || null, id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Task not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Update task error:', err.message);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

module.exports = router;
