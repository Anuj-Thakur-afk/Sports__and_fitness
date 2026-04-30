// /frontend/js/main.js
// Shared utilities used across all pages

const API_BASE = '/api';

/* ===== Token Helpers ===== */
const getToken = () => localStorage.getItem('fitlife_token');
const getUser = () => {
  const u = localStorage.getItem('fitlife_user');
  return u ? JSON.parse(u) : null;
};
const setAuth = (token, user) => {
  localStorage.setItem('fitlife_token', token);
  localStorage.setItem('fitlife_user', JSON.stringify(user));
};
const clearAuth = () => {
  localStorage.removeItem('fitlife_token');
  localStorage.removeItem('fitlife_user');
};

/* ===== Theme Management ===== */
const getTheme = () => localStorage.getItem('fitlife_theme') || 'dark';
const setTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('fitlife_theme', theme);
  updateThemeToggleIcon(theme);
};

const toggleTheme = () => {
  const newTheme = getTheme() === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
};

const updateThemeToggleIcon = (theme) => {
  const icon = document.querySelector('.theme-toggle');
  if (icon) {
    icon.textContent = theme === 'dark' ? '🌙' : '☀️';
  }
};

const initTheme = () => {
  const theme = getTheme();
  setTheme(theme);
  
  // Auto-inject toggle button if navbar-actions exists
  const actions = document.querySelector('.navbar-actions');
  if (actions && !document.querySelector('.theme-toggle')) {
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'theme-toggle';
    toggleBtn.type = 'button';
    toggleBtn.title = 'Toggle Light/Dark Mode';
    toggleBtn.onclick = toggleTheme;
    toggleBtn.textContent = theme === 'dark' ? '🌙' : '☀️';
    actions.prepend(toggleBtn);
  }
};

/* ===== Auth Guard ===== */
const requireAuth = () => {
  if (!getToken()) {
    window.location.href = '/login.html';
    return false;
  }
  return true;
};

/* ===== Fetch wrapper with auth ===== */
const apiFetch = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await res.json();

  // If token expired, redirect to login
  if (res.status === 401) {
    clearAuth();
    window.location.href = '/login.html';
    return null;
  }

  return { ok: res.ok, status: res.status, data };
};

/* ===== Toast Notification ===== */
const showToast = (message, type = 'success') => {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = (type === 'success' ? '✅ ' : '❌ ') + message;
  toast.className = `toast toast-${type} show`;
  setTimeout(() => { toast.className = 'toast'; }, 3500);
};

/* ===== Alert Helper ===== */
const showAlert = (id, message, type = 'error') => {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message;
  el.className = `alert alert-${type} show`;
  setTimeout(() => { el.className = `alert alert-${type}`; }, 5000);
};

/* ===== Navbar User Display ===== */
const initNavbar = () => {
  const user = getUser();
  const nameEl = document.getElementById('navUserName');
  if (nameEl && user) nameEl.textContent = `👋 ${user.name}`;

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearAuth();
      window.location.href = '/login.html';
    });
  }
};

/* ===== Format date ===== */
const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/* ===== Today's date YYYY-MM-DD ===== */
const todayStr = () => new Date().toISOString().split('T')[0];

/* ===== Run on DOM ready ===== */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavbar();
});
