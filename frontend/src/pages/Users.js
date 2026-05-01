import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, formatDate } from '../utils/api';

export default function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.getUsers()
      .then(res => setUsers(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (user?.role !== 'admin') {
    return (
      <div className="page-body">
        <div className="empty-state">
          <div className="icon">🔒</div>
          <h3>Access Denied</h3>
          <p>Only admins can manage users.</p>
        </div>
      </div>
    );
  }

  const handleRoleChange = async (userId, newRole) => {
    if (userId === user.id) { alert("You can't change your own role!"); return; }
    if (!window.confirm(`Change this user's role to ${newRole}?`)) return;
    try {
      await api.updateUserRole(userId, newRole);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update role');
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>👥 Users</h1>
          <p>{users.length} registered user{users.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="page-body">
        {loading ? (
          <div className="loading-screen" style={{ height: '200px' }}><div className="spinner"></div></div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="stats-grid" style={{ marginBottom: '24px' }}>
              <div className="stat-card accent">
                <div className="label">Total Users</div>
                <div className="value">{users.length}</div>
              </div>
              <div className="stat-card">
                <div className="label">Admins</div>
                <div className="value">{users.filter(u => u.role === 'admin').length}</div>
              </div>
              <div className="stat-card">
                <div className="label">Members</div>
                <div className="value">{users.filter(u => u.role === 'member').length}</div>
              </div>
              <div className="stat-card success">
                <div className="label">Total Tasks Assigned</div>
                <div className="value">{users.reduce((sum, u) => sum + (u.task_count || 0), 0)}</div>
              </div>
            </div>

            <div className="card" style={{ padding: 0 }}>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Projects</th>
                      <th>Tasks Assigned</th>
                      <th>Joined</th>
                      <th>Change Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="avatar">{u.name?.[0]?.toUpperCase()}</div>
                            <div>
                              <div style={{ fontWeight: 500 }}>{u.name}</div>
                              {u.id === user.id && <div className="text-xs" style={{ color: 'var(--accent2)' }}>You</div>}
                            </div>
                          </div>
                        </td>
                        <td className="text-muted">{u.email}</td>
                        <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                        <td className="font-mono">{u.project_count ?? '—'}</td>
                        <td className="font-mono">{u.task_count ?? '—'}</td>
                        <td className="text-muted">{formatDate(u.created_at)}</td>
                        <td>
                          {u.id !== user.id ? (
                            <select
                              className="select"
                              value={u.role}
                              onChange={e => handleRoleChange(u.id, e.target.value)}
                              style={{ width: '120px', padding: '5px 8px', fontSize: '12px' }}
                            >
                              <option value="member">Member</option>
                              <option value="admin">Admin</option>
                            </select>
                          ) : (
                            <span className="text-muted text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
