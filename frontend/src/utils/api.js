import axios from 'axios';
const BASE_URL = process.env.REACT_APP_API_URL || '';
axios.defaults.baseURL = BASE_URL;

export const api = {
  // Auth
  login: (email, password) => axios.post('/api/auth/login', { email, password }),
  signup: (name, email, password, role) => axios.post('/api/auth/signup', { name, email, password, role }),
  me: () => axios.get('/api/auth/me'),

  // Projects
  getProjects: () => axios.get('/api/projects'),
  getProject: (id) => axios.get(`/api/projects/${id}`),
  createProject: (data) => axios.post('/api/projects', data),
  updateProject: (id, data) => axios.put(`/api/projects/${id}`, data),
  deleteProject: (id) => axios.delete(`/api/projects/${id}`),
  addMember: (projectId, userId, role) => axios.post(`/api/projects/${projectId}/members`, { user_id: userId, role }),
  removeMember: (projectId, userId) => axios.delete(`/api/projects/${projectId}/members/${userId}`),

  // Tasks
  getTasks: (params) => axios.get('/api/tasks', { params }),
  getDashboard: () => axios.get('/api/tasks/dashboard'),
  createTask: (data) => axios.post('/api/tasks', data),
  updateTask: (id, data) => axios.put(`/api/tasks/${id}`, data),
  deleteTask: (id) => axios.delete(`/api/tasks/${id}`),

  // Users
  getUsers: () => axios.get('/api/users'),
  updateUserRole: (id, role) => axios.put(`/api/users/${id}/role`, { role }),
};

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function isOverdue(dueDate, status) {
  if (!dueDate || status === 'done') return false;
  return new Date(dueDate) < new Date();
}

export const STATUS_COLORS = {
  todo: '#6b7280',
  in_progress: '#3b82f6',
  review: '#f59e0b',
  done: '#10b981',
};

export const PRIORITY_COLORS = {
  low: '#6b7280',
  medium: '#3b82f6',
  high: '#f59e0b',
  urgent: '#ef4444',
};

export const STATUS_LABELS = {
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

export const PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};
