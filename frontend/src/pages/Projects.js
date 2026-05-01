import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    api.getProjects()
      .then(res => setProjects(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.createProject(form);
      setShowModal(false);
      setForm({ name: '', description: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Delete this project and all its tasks?')) return;
    await api.deleteProject(id);
    load();
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>📁 Projects</h1>
          <p>{projects.length} project{projects.length !== 1 ? 's' : ''} found</p>
        </div>
        {user?.role === 'admin' && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + New Project
          </button>
        )}
      </div>

      <div className="page-body">
        {projects.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📁</div>
            <h3>No projects yet</h3>
            <p>{user?.role === 'admin' ? 'Create your first project to get started.' : 'You have not been added to any projects yet.'}</p>
          </div>
        ) : (
          <div className="grid-3">
            {projects.map(project => {
              const progress = project.task_count > 0 ? Math.round((project.done_count / project.task_count) * 100) : 0;
              return (
                <Link key={project.id} to={`/projects/${project.id}`} className="project-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span className={`badge badge-${project.status}`}>{project.status}</span>
                    {user?.role === 'admin' && (
                      <button className="btn btn-sm btn-danger" onClick={(e) => handleDelete(project.id, e)} style={{ padding: '4px 8px', fontSize: '11px' }}>🗑</button>
                    )}
                  </div>
                  <h3>{project.name}</h3>
                  <p>{project.description || 'No description provided.'}</p>

                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                  </div>

                  <div className="project-footer">
                    <span>👤 {project.owner_name}</span>
                    <span>{project.done_count}/{project.task_count} tasks · {progress}%</span>
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text2)' }}>
                    👥 {project.member_count} member{project.member_count !== 1 ? 's' : ''}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>📁 Create New Project</h2>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Project Name *</label>
                <input className="input" placeholder="e.g. Website Redesign" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="textarea" placeholder="What is this project about?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Project'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
