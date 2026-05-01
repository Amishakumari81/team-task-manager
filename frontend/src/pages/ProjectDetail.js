import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, formatDate, STATUS_LABELS, PRIORITY_LABELS, isOverdue } from '../utils/api';

function TaskModal({ project, users, onClose, onSave, task }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    assignee_id: task?.assignee_id || '',
    due_date: task?.due_date || '',
    project_id: project.id,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, assignee_id: form.assignee_id || null, due_date: form.due_date || null };
      if (task) await api.updateTask(task.id, payload);
      else await api.createTask(payload);
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const canEditAll = user?.role === 'admin' || !task || task.creator_id === user?.id;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
        <h2>{task ? '✏️ Edit Task' : '➕ New Task'}</h2>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title *</label>
            <input className="input" placeholder="Task title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required disabled={!canEditAll} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="textarea" placeholder="Task details..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} disabled={!canEditAll} />
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
              <select className="select" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} disabled={!canEditAll}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>Assign To</label>
              <select className="select" value={form.assignee_id} onChange={e => setForm({ ...form, assignee_id: e.target.value })} disabled={!canEditAll}>
                <option value="">Unassigned</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Due Date</label>
              <input className="input" type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} disabled={!canEditAll} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : task ? 'Update Task' : 'Create Task'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddMemberModal({ projectId, onClose, onSave }) {
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('member');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getUsers().then(res => setUsers(res.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.addMember(projectId, userId, role);
      onSave();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add member');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>👥 Add Member</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Select User</label>
            <select className="select" value={userId} onChange={e => setUserId(e.target.value)} required>
              <option value="">Choose user...</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Project Role</label>
            <select className="select" value={role} onChange={e => setRole(e.target.value)}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Adding...' : 'Add Member'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [taskModal, setTaskModal] = useState(null); // null | 'new' | task object
  const [memberModal, setMemberModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(() => {
    api.getProject(id)
      .then(res => setProject(res.data))
      .catch(() => navigate('/projects'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  useEffect(load, [load]);

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  if (!project) return null;

  const filteredTasks = statusFilter ? project.tasks.filter(t => t.status === statusFilter) : project.tasks;
  const progress = project.tasks.length > 0 ? Math.round((project.tasks.filter(t => t.status === 'done').length / project.tasks.length) * 100) : 0;

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    await api.deleteTask(taskId);
    load();
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Remove this member?')) return;
    await api.removeMember(id, memberId);
    load();
  };

  const handleQuickStatus = async (task, newStatus) => {
    await api.updateTask(task.id, { ...task, status: newStatus });
    load();
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/projects')}>← Back</button>
            <span className={`badge badge-${project.status}`}>{project.status}</span>
          </div>
          <h1>📁 {project.name}</h1>
          <p>{project.description || 'No description'}</p>
        </div>
        {user?.role === 'admin' && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={() => setMemberModal(true)}>+ Add Member</button>
            <button className="btn btn-primary" onClick={() => setTaskModal('new')}>+ New Task</button>
          </div>
        )}
        {user?.role === 'member' && (
          <button className="btn btn-primary" onClick={() => setTaskModal('new')}>+ New Task</button>
        )}
      </div>

      <div className="page-body">
        {/* Progress */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span className="text-sm text-muted">{project.tasks.filter(t => t.status === 'done').length} of {project.tasks.length} tasks completed</span>
            <span className="text-sm" style={{ fontFamily: 'var(--mono)', color: 'var(--accent2)' }}>{progress}%</span>
          </div>
          <div className="progress-bar" style={{ height: '8px' }}>
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
          {['tasks', 'members'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className="btn btn-sm"
              style={{ borderRadius: '8px 8px 0 0', background: activeTab === tab ? 'var(--accent)' : 'transparent', color: activeTab === tab ? 'white' : 'var(--text2)', border: 'none' }}>
              {tab === 'tasks' ? `✅ Tasks (${project.tasks.length})` : `👥 Members (${project.members.length})`}
            </button>
          ))}
        </div>

        {activeTab === 'tasks' && (
          <>
            <div className="filters-bar">
              <select className="select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: '160px' }}>
                <option value="">All Statuses</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>

            {filteredTasks.length === 0 ? (
              <div className="empty-state">
                <div className="icon">✅</div>
                <h3>No tasks found</h3>
                <p>Create a task to get started.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filteredTasks.map(task => (
                  <div key={task.id} className={`task-card ${isOverdue(task.due_date, task.status) ? 'overdue' : ''}`}>
                    <div className="task-card-header">
                      <div style={{ flex: 1 }}>
                        <h4>{task.title}</h4>
                        {task.description && <p className="text-sm text-muted" style={{ marginTop: '4px' }}>{task.description}</p>}
                      </div>
                      <div className="actions">
                        <button className="btn btn-sm btn-secondary" onClick={() => setTaskModal(task)}>✏️</button>
                        {(user?.role === 'admin' || task.creator_id === user?.id) && (
                          <button className="btn btn-sm btn-danger" onClick={() => handleDeleteTask(task.id)}>🗑</button>
                        )}
                      </div>
                    </div>
                    <div className="meta" style={{ marginBottom: '10px' }}>
                      <span className={`badge badge-${task.priority}`}>{PRIORITY_LABELS[task.priority]}</span>
                      {task.assignee_name && <span>👤 {task.assignee_name}</span>}
                      {task.due_date && (
                        <span className={isOverdue(task.due_date, task.status) ? 'overdue-text' : ''}>
                          📅 {formatDate(task.due_date)}
                        </span>
                      )}
                      <span className="text-muted">by {task.creator_name}</span>
                    </div>
                    {/* Quick status change */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {['todo', 'in_progress', 'review', 'done'].map(s => (
                        <button key={s} onClick={() => handleQuickStatus(task, s)}
                          className={`badge badge-${s}`}
                          style={{ cursor: 'pointer', border: task.status === s ? '2px solid currentColor' : '1px solid transparent', background: task.status === s ? undefined : 'transparent' }}>
                          {STATUS_LABELS[s]}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'members' && (
          <div className="card">
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Email</th>
                  <th>Global Role</th>
                  <th>Project Role</th>
                  <th>Joined</th>
                  {user?.role === 'admin' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {project.members.map(member => (
                  <tr key={member.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="avatar" style={{ width: '28px', height: '28px', fontSize: '11px' }}>{member.name?.[0]?.toUpperCase()}</div>
                        {member.name}
                      </div>
                    </td>
                    <td className="text-muted">{member.email}</td>
                    <td><span className={`badge badge-${member.global_role}`}>{member.global_role}</span></td>
                    <td><span className={`badge badge-${member.project_role}`}>{member.project_role}</span></td>
                    <td className="text-muted">{formatDate(member.joined_at)}</td>
                    {user?.role === 'admin' && (
                      <td>
                        {member.id !== user.id && (
                          <button className="btn btn-sm btn-danger" onClick={() => handleRemoveMember(member.id)}>Remove</button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {taskModal !== null && (
        <TaskModal
          project={project}
          users={project.members}
          task={taskModal === 'new' ? null : taskModal}
          onClose={() => setTaskModal(null)}
          onSave={() => { setTaskModal(null); load(); }}
        />
      )}

      {memberModal && (
        <AddMemberModal
          projectId={id}
          onClose={() => setMemberModal(false)}
          onSave={() => { setMemberModal(false); load(); }}
        />
      )}
    </>
  );
}
