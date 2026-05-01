import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', icon: '📊', label: 'Dashboard' },
    { to: '/projects', icon: '📁', label: 'Projects' },
    { to: '/tasks', icon: '✅', label: 'All Tasks' },
    ...(user?.role === 'admin' ? [{ to: '/users', icon: '👥', label: 'Users' }] : []),
  ];

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">⚡</div>
          <div>
            <h2>TaskFlow</h2>
            <span>Team Manager</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <div>
              <div className="name">{user?.name}</div>
              <span className={`badge badge-${user?.role}`}>{user?.role}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            🚪 Sign Out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
