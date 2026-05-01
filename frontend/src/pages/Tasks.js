import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, formatDate, STATUS_LABELS, PRIORITY_LABELS, isOverdue } from '../utils/api';

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', priority: '', overdue: '' });
  const [editTask, setEditTask] = useState(null);
  const [projects, setProjects] = useState([]);

  const load = () => {
    const params = {};
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;
    if (filters.overdue) params.overdue = filters.overdue;
    api.getTasks(params)
      .then(res => setTasks(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, [filters]);
  useEffect(() => { api.getProjects().then(res => setProjects(res.data)); }, []);

  const handleStatusChange = async (task, newStatus) => {
    await api.updateTask(task.id, { ...task, status: newStatus });
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    await api.deleteTask(id);
    load();
  };

  const handleSave = async (e, form, taskId) => {
    e.preventDefault();
    try {
      await api.updateTask(taskId, form);
      setEditTask(null);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update task');
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>✅ All Tasks</h1>
          <p>{tasks.length} task{tasks.length !== 1 ? 's' : ''} found</p>
        </div>
      </div>

      <div className="page-body">
        {/* Filters */}
        <div className="filters-bar">
          <select className="select" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} style={{ width: '150px' }}>
            <option value="">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
          <select className="select" value={filters.priority} onChange={e => setFilters({ ...filters, priority: e.target.value })} style={{ width: '150px' }}>
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <select className="select" value={filters.overdue} onChange={e => setFilters({ ...filters, overdue: e.target.value })} style={{ width: '150px' }}>
            <option value="">All Tasks</option>
            <option value="true">Overdue Only</option>
          </select>
          {(filters.status || filters.priority || filters.overdue) && (
            <button className="btn btn-secondary btn-sm" onClick={() => setFilters({ status: '', priority: '', overdue: '' })}>Clear Filters</button>
          )}
        </div>

        {loading ? (
          <div className="loading-screen" style={{ height: '200px' }}><div className="spinner"></div></div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <div className="icon">✅</div>
            <h3>No tasks found</h3>
            <p>Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Project</th>
                    <th>Assignee</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Due Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map(task => (
                    <tr key={task.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{task.title}</div>
                        {task.description && <div className="text-xs text-muted" style={{ marginTop: '2px' }}>{task.description.substring(0, 60)}{task.description.length > 60 ? '...' : ''}</div>}
                      </td>
                      <td className="text-muted">{task.project_name}</td>
                      <td>{task.assignee_name || <span className="text-muted">—</span>}</td>
                      <td><span className={`badge badge-${task.priority}`}>{PRIORITY_LABELS[task.priority]}</span></td>
                      <td>
                        <select
                          className="select"
                          value={task.status}
                          onChange={e => handleStatusChange(task, e.target.value)}
                          style={{ width: '130px', padding: '4px 8px', fontSize: '12px' }}
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="review">Review</option>
                          <option value="done">Done</option>
                        </select>
                      </td>
                      <td>
                        {task.due_date ? (
                          <span className={isOverdue(task.due_date, task.status) ? 'overdue-text' : 'text-muted'}>
                            {isOverdue(task.due_date, task.status) ? '⚠️ ' : ''}{formatDate(task.due_date)}
                          </span>
                        ) : <span className="text-muted">—</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {(user?.role === 'admin' || task.creator_id === user?.id || task.assignee_id === user?.id) && (
                            <button className="btn btn-sm btn-secondary" onClick={() => setEditTask(task)}>✏️</button>
                          )}
                          {(user?.role === 'admin' || task.creator_id === user?.id) && (
                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(task.id)}>🗑</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editTask && (
        <EditTaskModal task={editTask} projects={projects} onClose={() => setEditTask(null)} onSave={() => { setEditTask(null); load(); }} />
      )}
    </>
  );
}

function EditTaskModal({ task, onClose, onSave }) {
  const [form, setForm] = useState({ ...task });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateTask(task.id, form);
      onSave();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>✏️ Edit Task</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title</label>
            <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="textarea" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>Status</label>
              <select className="select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select className="select" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Due Date</label>
            <input className="input" type="date" value={form.due_date || ''} onChange={e => setForm({ ...form, due_date: e.target.value })} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
