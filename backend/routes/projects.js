const express = require('express');
const { dbGet, dbAll, dbRun, dbInsert, saveDb } = require('../models/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', (req, res) => {
  try {
    let projects;
    if (req.user.role === 'admin') {
      projects = dbAll(`SELECT p.*, u.name as owner_name,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'done') as done_count,
        (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count
        FROM projects p JOIN users u ON p.owner_id = u.id ORDER BY p.created_at DESC`);
    } else {
      projects = dbAll(`SELECT p.*, u.name as owner_name, pm.role as my_role,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'done') as done_count,
        (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count
        FROM projects p JOIN users u ON p.owner_id = u.id
        JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
        ORDER BY p.created_at DESC`, [req.user.id]);
    }
    res.json(projects);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Only admins can create projects' });
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name is required' });
  try {
    const result = dbInsert('INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)', [name, description || '', req.user.id]);
    dbInsert('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)', [result.lastInsertRowid, req.user.id, 'admin']);
    saveDb();
    const project = dbGet('SELECT p.*, u.name as owner_name FROM projects p JOIN users u ON p.owner_id = u.id WHERE p.id = ?', [result.lastInsertRowid]);
    res.status(201).json(project);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', (req, res) => {
  try {
    const project = dbGet('SELECT p.*, u.name as owner_name FROM projects p JOIN users u ON p.owner_id = u.id WHERE p.id = ?', [req.params.id]);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const members = dbAll(`SELECT u.id, u.name, u.email, u.role as global_role, pm.role as project_role, pm.joined_at
      FROM project_members pm JOIN users u ON pm.user_id = u.id WHERE pm.project_id = ?`, [req.params.id]);
    const tasks = dbAll(`SELECT t.*, u.name as assignee_name, c.name as creator_name
      FROM tasks t LEFT JOIN users u ON t.assignee_id = u.id JOIN users c ON t.creator_id = c.id
      WHERE t.project_id = ? ORDER BY t.created_at DESC`, [req.params.id]);
    res.json({ ...project, members, tasks });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Only admins can update projects' });
  const { name, description, status } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name is required' });
  try {
    dbRun('UPDATE projects SET name = ?, description = ?, status = ? WHERE id = ?', [name, description || '', status || 'active', req.params.id]);
    saveDb();
    const project = dbGet('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    res.json(project);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Only admins can delete projects' });
  try {
    dbRun('DELETE FROM tasks WHERE project_id = ?', [req.params.id]);
    dbRun('DELETE FROM project_members WHERE project_id = ?', [req.params.id]);
    dbRun('DELETE FROM projects WHERE id = ?', [req.params.id]);
    saveDb();
    res.json({ message: 'Project deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/members', (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Only admins can add members' });
  const { user_id, role } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id is required' });
  try {
    const user = dbGet('SELECT id FROM users WHERE id = ?', [user_id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const existing = dbGet('SELECT id FROM project_members WHERE project_id = ? AND user_id = ?', [req.params.id, user_id]);
    if (existing) {
      dbRun('UPDATE project_members SET role = ? WHERE project_id = ? AND user_id = ?', [role || 'member', req.params.id, user_id]);
    } else {
      dbInsert('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)', [req.params.id, user_id, role || 'member']);
    }
    saveDb();
    res.json({ message: 'Member added successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id/members/:userId', (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Only admins can remove members' });
  try {
    dbRun('DELETE FROM project_members WHERE project_id = ? AND user_id = ?', [req.params.id, req.params.userId]);
    saveDb();
    res.json({ message: 'Member removed successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
