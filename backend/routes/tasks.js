const express = require('express');
const { dbGet, dbAll, dbRun, dbInsert, saveDb } = require('../models/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/dashboard', (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    let total, myTasks, overdue, completed, statusBreakdown, priorityBreakdown, recentTasks, overdueList;

    if (isAdmin) {
      total = dbGet('SELECT COUNT(*) as count FROM tasks') || { count: 0 };
      myTasks = dbGet('SELECT COUNT(*) as count FROM tasks WHERE assignee_id = ?', [userId]) || { count: 0 };
      overdue = dbGet("SELECT COUNT(*) as count FROM tasks WHERE due_date < date('now') AND status != 'done'") || { count: 0 };
      completed = dbGet("SELECT COUNT(*) as count FROM tasks WHERE status = 'done'") || { count: 0 };
      statusBreakdown = dbAll('SELECT status, COUNT(*) as count FROM tasks GROUP BY status');
      priorityBreakdown = dbAll('SELECT priority, COUNT(*) as count FROM tasks GROUP BY priority');
      recentTasks = dbAll(`SELECT t.*, u.name as assignee_name, p.name as project_name
        FROM tasks t LEFT JOIN users u ON t.assignee_id = u.id JOIN projects p ON t.project_id = p.id
        ORDER BY t.created_at DESC LIMIT 5`);
      overdueList = dbAll(`SELECT t.*, u.name as assignee_name, p.name as project_name
        FROM tasks t LEFT JOIN users u ON t.assignee_id = u.id JOIN projects p ON t.project_id = p.id
        WHERE t.due_date < date('now') AND t.status != 'done' ORDER BY t.due_date ASC LIMIT 5`);
    } else {
      total = dbGet('SELECT COUNT(*) as count FROM tasks t JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = ?', [userId]) || { count: 0 };
      myTasks = dbGet('SELECT COUNT(*) as count FROM tasks t JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = ? WHERE t.assignee_id = ?', [userId, userId]) || { count: 0 };
      overdue = dbGet("SELECT COUNT(*) as count FROM tasks t JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = ? WHERE t.due_date < date('now') AND t.status != 'done'", [userId]) || { count: 0 };
      completed = dbGet("SELECT COUNT(*) as count FROM tasks t JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = ? WHERE t.status = 'done'", [userId]) || { count: 0 };
      statusBreakdown = dbAll('SELECT t.status, COUNT(*) as count FROM tasks t JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = ? GROUP BY t.status', [userId]);
      priorityBreakdown = dbAll('SELECT t.priority, COUNT(*) as count FROM tasks t JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = ? GROUP BY t.priority', [userId]);
      recentTasks = dbAll(`SELECT t.*, u.name as assignee_name, p.name as project_name
        FROM tasks t JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = ?
        LEFT JOIN users u ON t.assignee_id = u.id JOIN projects p ON t.project_id = p.id
        ORDER BY t.created_at DESC LIMIT 5`, [userId]);
      overdueList = dbAll(`SELECT t.*, u.name as assignee_name, p.name as project_name
        FROM tasks t JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = ?
        LEFT JOIN users u ON t.assignee_id = u.id JOIN projects p ON t.project_id = p.id
        WHERE t.due_date < date('now') AND t.status != 'done' ORDER BY t.due_date ASC LIMIT 5`, [userId]);
    }

    res.json({
      stats: { total: total.count, myTasks: myTasks.count, overdue: overdue.count, completed: completed.count },
      statusBreakdown, priorityBreakdown, recentTasks, overdueList
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/', (req, res) => {
  try {
    const { project_id, assignee_id, status, priority, overdue } = req.query;
    const conditions = [];
    const params = [];

    let baseQuery = `SELECT t.*, u.name as assignee_name, c.name as creator_name, p.name as project_name
      FROM tasks t LEFT JOIN users u ON t.assignee_id = u.id
      JOIN users c ON t.creator_id = c.id JOIN projects p ON t.project_id = p.id`;

    if (req.user.role !== 'admin') {
      baseQuery += ` JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = ?`;
      params.push(req.user.id);
    }

    if (project_id) { conditions.push('t.project_id = ?'); params.push(project_id); }
    if (assignee_id) { conditions.push('t.assignee_id = ?'); params.push(assignee_id); }
    if (status) { conditions.push('t.status = ?'); params.push(status); }
    if (priority) { conditions.push('t.priority = ?'); params.push(priority); }
    if (overdue === 'true') { conditions.push("t.due_date < date('now') AND t.status != 'done'"); }

    if (conditions.length > 0) baseQuery += ' WHERE ' + conditions.join(' AND ');
    baseQuery += ' ORDER BY t.created_at DESC';

    const tasks = dbAll(baseQuery, params);
    res.json(tasks);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', (req, res) => {
  const { title, description, project_id, assignee_id, priority, due_date } = req.body;
  if (!title || !project_id) return res.status(400).json({ error: 'Title and project_id are required' });
  try {
    if (req.user.role !== 'admin') {
      const member = dbGet('SELECT id FROM project_members WHERE project_id = ? AND user_id = ?', [project_id, req.user.id]);
      if (!member) return res.status(403).json({ error: 'No access to this project' });
    }
    const result = dbInsert(
      'INSERT INTO tasks (title, description, project_id, assignee_id, creator_id, priority, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, description || '', project_id, assignee_id || null, req.user.id, priority || 'medium', due_date || null]
    );
    saveDb();
    const task = dbGet(`SELECT t.*, u.name as assignee_name, c.name as creator_name, p.name as project_name
      FROM tasks t LEFT JOIN users u ON t.assignee_id = u.id JOIN users c ON t.creator_id = c.id
      JOIN projects p ON t.project_id = p.id WHERE t.id = ?`, [result.lastInsertRowid]);
    res.status(201).json(task);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', (req, res) => {
  const { title, description, status, priority, assignee_id, due_date } = req.body;
  try {
    const task = dbGet('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (req.user.role !== 'admin' && task.creator_id !== req.user.id && task.assignee_id !== req.user.id)
      return res.status(403).json({ error: 'Permission denied' });
    dbRun(`UPDATE tasks SET title = ?, description = ?, status = ?, priority = ?,
      assignee_id = ?, due_date = ?, updated_at = datetime('now') WHERE id = ?`,
      [title || task.title, description !== undefined ? description : task.description,
       status || task.status, priority || task.priority,
       assignee_id !== undefined ? (assignee_id || null) : task.assignee_id,
       due_date !== undefined ? (due_date || null) : task.due_date,
       req.params.id]);
    saveDb();
    const updated = dbGet(`SELECT t.*, u.name as assignee_name, c.name as creator_name, p.name as project_name
      FROM tasks t LEFT JOIN users u ON t.assignee_id = u.id JOIN users c ON t.creator_id = c.id
      JOIN projects p ON t.project_id = p.id WHERE t.id = ?`, [req.params.id]);
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', (req, res) => {
  try {
    const task = dbGet('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (req.user.role !== 'admin' && task.creator_id !== req.user.id)
      return res.status(403).json({ error: 'Only admin or task creator can delete' });
    dbRun('DELETE FROM tasks WHERE id = ?', [req.params.id]);
    saveDb();
    res.json({ message: 'Task deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
