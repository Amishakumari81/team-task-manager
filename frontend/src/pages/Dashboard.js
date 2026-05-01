import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, formatDate, STATUS_LABELS, PRIORITY_LABELS } from '../utils/api';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard()
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  const { stats, statusBreakdown, recentTasks, overdueList } = data || {};

  return (
    <>
      <div className="page-header">
        <div>
          <h1>👋 Hello, {user?.name?.split(' ')[0]}!</h1>
          <p>Here's what's happening with your projects today.</p>
        </div>
        <span className={`badge badge-${user?.role}`}>{user?.role === 'admin' ? '🛡 Admin' : '👤 Member'}</span>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card accent">
            <div className="label">Total Tasks</div>
            <div className="value">{stats?.total ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="label">My Tasks</div>
            <div className="value">{stats?.myTasks ?? 0}</div>
          </div>
          <div className="stat-card success">
            <div className="label">Completed</div>
            <div className="value">{stats?.completed ?? 0}</div>
          </div>
          <div className="stat-card danger">
            <div className="label">Overdue</div>
            <div className="value">{stats?.overdue ?? 0}</div>
          </div>
        </div>

        <div className="dashboard-grid">
          {/* Recent Tasks */}
          <div className="card">
            <div className="card-header">
              <h3>🕐 Recent Tasks</h3>
            </div>
            {recentTasks?.length === 0 ? (
              <div className="empty-state">
                <div className="icon">📭</div>
                <h3>No tasks yet</h3>
                <p>Tasks you create or are assigned to will appear here.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {recentTasks?.map(task => (
                  <div key={task.id} className="task-card">
                    <div className="task-card-header">
                      <h4>{task.title}</h4>
                      <span className={`badge badge-${task.status}`}>{STATUS_LABELS[task.status]}</span>
                    </div>
                    <div className="meta">
                      <span>📁 {task.project_name}</span>
                      {task.assignee_name && <span>👤 {task.assignee_name}</span>}
                      <span className={`badge badge-${task.priority}`}>{PRIORITY_LABELS[task.priority]}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Status Breakdown */}
            <div className="card">
              <div className="card-header"><h3>📈 Status Breakdown</h3></div>
              {statusBreakdown?.length === 0 ? (
                <p className="text-muted text-sm">No data yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {statusBreakdown?.map(s => (
                    <div key={s.status}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <span className={`badge badge-${s.status}`}>{STATUS_LABELS[s.status]}</span>
                        <span className="text-muted">{s.count}</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${stats?.total ? (s.count / stats.total) * 100 : 0}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Overdue Tasks */}
            {overdueList?.length > 0 && (
              <div className="card">
                <div className="card-header"><h3>🚨 Overdue Tasks</h3></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {overdueList.map(task => (
                    <div key={task.id} className="task-card overdue">
                      <h4 style={{ fontSize: '13px' }}>{task.title}</h4>
                      <div className="meta" style={{ marginTop: '4px' }}>
                        <span className="overdue-text">📅 Due: {formatDate(task.due_date)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
