const express = require('express');
const { dbGet, dbAll, dbRun, saveDb } = require('../models/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', (req, res) => {
  try {
    let users;
    if (req.user.role === 'admin') {
      users = dbAll(`SELECT id, name, email, role, created_at,
        (SELECT COUNT(*) FROM tasks WHERE assignee_id = users.id) as task_count,
        (SELECT COUNT(*) FROM project_members WHERE user_id = users.id) as project_count
        FROM users ORDER BY created_at DESC`);
    } else {
      users = dbAll(`SELECT DISTINCT u.id, u.name, u.email, u.role FROM users u
        JOIN project_members pm ON pm.user_id = u.id
        WHERE pm.project_id IN (SELECT project_id FROM project_members WHERE user_id = ?)
        ORDER BY u.name`, [req.user.id]);
    }
    res.json(users);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id/role', (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  const { role } = req.body;
  if (!['admin', 'member'].includes(role)) return res.status(400).json({ error: 'Role must be admin or member' });
  try {
    dbRun('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
    saveDb();
    const user = dbGet('SELECT id, name, email, role FROM users WHERE id = ?', [req.params.id]);
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
