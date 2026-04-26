// /frontend/js/dashboard.js
// Dashboard: stats, workout CRUD with pagination

let currentPage = 1;
let totalPages = 1;
let editingWorkoutId = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;

  // Set greeting
  const user = getUser();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const greetEl = document.getElementById('greetingText');
  if (greetEl && user) greetEl.textContent = `${greeting}, ${user.name}! Here's your fitness overview.`;

  // Load all data
  await Promise.all([loadStats(), loadWorkouts(1), loadTodayGoal(), loadGraphs()]);

  // Modal controls
  document.getElementById('addWorkoutBtn').addEventListener('click', openAddModal);
  document.getElementById('closeModal').addEventListener('click', closeModal);
  document.getElementById('cancelModal').addEventListener('click', closeModal);
  document.getElementById('workoutModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  // Workout form submit
  document.getElementById('workoutForm').addEventListener('submit', handleWorkoutSubmit);
});

/* ===== Load Stats ===== */
const loadStats = async () => {
  const result = await apiFetch('/workouts/stats');
  if (!result || !result.ok) return;

  const { totalWorkouts, totalCalories, totalDuration } = result.data.stats;
  document.getElementById('totalWorkouts').textContent = totalWorkouts;
  document.getElementById('totalCalories').textContent = totalCalories.toLocaleString();
  document.getElementById('totalDuration').textContent = totalDuration;
};

/* ===== Load Workouts (Paginated) ===== */
const loadWorkouts = async (page = 1) => {
  currentPage = page;
  const result = await apiFetch(`/workouts?page=${page}&limit=5`);
  if (!result || !result.ok) return;

  const { workouts, pagination } = result.data;
  totalPages = pagination.pages;

  renderWorkouts(workouts);
  renderPagination(pagination);
};

const renderWorkouts = (workouts) => {
  const list = document.getElementById('recentWorkoutsList');

  if (!workouts.length) {
    list.innerHTML = `<div class="empty-state">
      <div class="empty-icon">🏋️</div>
      <p>No workouts yet. Add your first!</p>
    </div>`;
    return;
  }

  list.innerHTML = workouts.map(w => `
    <div class="workout-item" data-id="${w._id}">
      <div>
        <span class="workout-type-badge badge-${w.type}">${w.type}</span>
      </div>
      <div class="workout-info">
        <div class="workout-title">${escapeHtml(w.title)}</div>
        <div class="workout-meta">
          <span>⏱ ${w.duration} min</span>
          <span>🔥 ${w.caloriesBurned} kcal</span>
          <span>📅 ${formatDate(w.date)}</span>
        </div>
      </div>
      <div class="workout-actions">
        <button class="btn btn-secondary btn-sm edit-btn" data-id="${w._id}">✏️</button>
        <button class="btn btn-danger btn-sm delete-btn" data-id="${w._id}">🗑️</button>
      </div>
    </div>
  `).join('');

  // Edit buttons
  list.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(btn.dataset.id, workouts));
  });

  // Delete buttons
  list.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteWorkout(btn.dataset.id));
  });
};

/* ===== Pagination ===== */
const renderPagination = ({ page, pages }) => {
  const container = document.getElementById('workoutPagination');
  if (pages <= 1) { container.innerHTML = ''; return; }

  let html = `<button ${page === 1 ? 'disabled' : ''} data-page="${page - 1}">←</button>`;
  for (let i = 1; i <= pages; i++) {
    html += `<button class="${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
  }
  html += `<button ${page === pages ? 'disabled' : ''} data-page="${page + 1}">→</button>`;
  container.innerHTML = html;

  container.querySelectorAll('button:not(:disabled)').forEach(btn => {
    btn.addEventListener('click', () => loadWorkouts(parseInt(btn.dataset.page)));
  });
};

/* ===== Load Today's Goal ===== */
const loadTodayGoal = async () => {
  const result = await apiFetch(`/goals?date=${todayStr()}`);
  if (!result || !result.ok) return;

  const goal = result.data.goal;
  const card = document.getElementById('todayGoalCard');
  const statEl = document.getElementById('todayGoalProgress');

  if (!goal) {
    card.innerHTML = `<div class="empty-state">
      <div class="empty-icon">🎯</div>
      <p>No goal set for today. <a href="/goal.html" style="color:var(--green-600);">Set one →</a></p>
    </div>`;
    if (statEl) statEl.textContent = '—';
    return;
  }

  const pct = Math.min(Math.round((goal.calorieProgress / goal.calorieGoal) * 100), 100);
  const fillClass = pct >= 100 ? 'exceeded' : pct >= 75 ? 'warning' : '';

  if (statEl) statEl.textContent = `${pct}%`;

  card.innerHTML = `
    <div class="progress-container">
      <div class="progress-label">
        <span>${goal.calorieProgress} / ${goal.calorieGoal} kcal</span>
        <span style="font-weight:700; color:${pct >= 100 ? '#16a34a' : 'var(--gray-500)'}">
          ${pct >= 100 ? '🎉 Goal Reached!' : `${pct}%`}
        </span>
      </div>
      <div class="progress-bar-track" style="height:12px;">
        <div class="progress-bar-fill ${fillClass}" style="width:${pct}%"></div>
      </div>
    </div>
    ${goal.notes ? `<p style="font-size:0.8rem; color:var(--gray-500); margin-top:6px;">📝 ${escapeHtml(goal.notes)}</p>` : ''}
  `;
};

/* ===== Modal Controls ===== */
const openAddModal = () => {
  editingWorkoutId = null;
  document.getElementById('modalTitle').textContent = 'Add Workout';
  document.getElementById('workoutForm').reset();
  document.getElementById('workoutId').value = '';
  document.getElementById('workoutDate').value = todayStr();
  document.getElementById('workoutError').className = 'alert alert-error';
  document.getElementById('workoutModal').classList.add('open');
};

const openEditModal = (id, workouts) => {
  const w = workouts.find(w => w._id === id);
  if (!w) return;

  editingWorkoutId = id;
  document.getElementById('modalTitle').textContent = 'Edit Workout';
  document.getElementById('workoutId').value = w._id;
  document.getElementById('workoutTitle').value = w.title;
  document.getElementById('workoutType').value = w.type;
  document.getElementById('workoutDuration').value = w.duration;
  document.getElementById('workoutCalories').value = w.caloriesBurned;
  document.getElementById('workoutNotes').value = w.notes || '';
  document.getElementById('workoutDate').value = w.date ? w.date.split('T')[0] : todayStr();
  document.getElementById('workoutError').className = 'alert alert-error';
  document.getElementById('workoutModal').classList.add('open');
};

const closeModal = () => {
  document.getElementById('workoutModal').classList.remove('open');
};

/* ===== Workout CRUD ===== */
const handleWorkoutSubmit = async (e) => {
  e.preventDefault();

  const title = document.getElementById('workoutTitle').value.trim();
  const type = document.getElementById('workoutType').value;
  const duration = parseInt(document.getElementById('workoutDuration').value);
  const caloriesBurned = parseInt(document.getElementById('workoutCalories').value);
  const notes = document.getElementById('workoutNotes').value.trim();
  const date = document.getElementById('workoutDate').value;

  // Validation
  if (!title || !type || !duration || !caloriesBurned) {
    showAlert('workoutError', 'Please fill in all required fields.');
    return;
  }

  const btn = document.getElementById('saveWorkoutBtn');
  btn.textContent = 'Saving...';
  btn.disabled = true;

  try {
    const isEdit = !!editingWorkoutId;
    const endpoint = isEdit ? `/workouts/${editingWorkoutId}` : '/workouts';
    const method = isEdit ? 'PUT' : 'POST';

    const result = await apiFetch(endpoint, {
      method,
      body: JSON.stringify({ title, type, duration, caloriesBurned, notes, date }),
    });

    if (!result) return;

    if (result.ok) {
      closeModal();
      showToast(isEdit ? 'Workout updated!' : 'Workout added!');
      await Promise.all([loadStats(), loadWorkouts(isEdit ? currentPage : 1)]);
    } else {
      showAlert('workoutError', result.data.message || 'Failed to save workout.');
    }
  } catch (err) {
    showAlert('workoutError', 'Network error.');
  } finally {
    btn.textContent = 'Save Workout';
    btn.disabled = false;
  }
};

const deleteWorkout = async (id) => {
  if (!confirm('Delete this workout?')) return;

  const result = await apiFetch(`/workouts/${id}`, { method: 'DELETE' });
  if (!result) return;

  if (result.ok) {
    showToast('Workout deleted.', 'success');
    // Go back one page if current page is now empty
    const newPage = currentPage > 1 ? currentPage - 1 : 1;
    await Promise.all([loadStats(), loadWorkouts(newPage)]);
  } else {
    showToast('Failed to delete workout.', 'error');
  }
};

/* ===== Escape HTML ===== */
const escapeHtml = (str) => {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

/* ===== Graphs Logic ===== */
let calorieChartInstance = null;
let workoutChartInstance = null;

const loadGraphs = async () => {
  const result = await apiFetch('/workouts?page=1&limit=100');
  if (!result || !result.ok) return;

  const workouts = result.data.workouts.reverse();

  let dates = workouts.map(w => w.date ? w.date.split('T')[0] : '');
  let calories = workouts.map(w => w.caloriesBurned);

  // Fix for single data point
  if (dates.length === 1) {
    const d = new Date(dates[0]);
    d.setDate(d.getDate() - 1);
    dates.unshift(d.toISOString().split('T')[0]);
    calories.unshift(0);
  }

  const categories = { cardio: 0, strength: 0, yoga: 0 };
  workouts.forEach(w => {
    const type = w.type.toLowerCase();
    if (categories[type] !== undefined) categories[type]++;
  });

  const ctxCalorie = document.getElementById('calorieChart').getContext('2d');
  if (calorieChartInstance) calorieChartInstance.destroy();
  calorieChartInstance = new Chart(ctxCalorie, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [{
        label: 'Calories Burned',
        data: calories,
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.2)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#ea580c',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, grid: { borderDash: [4, 4] } }
      }
    }
  });

  const ctxWorkout = document.getElementById('workoutChart').getContext('2d');
  if (workoutChartInstance) workoutChartInstance.destroy();
  workoutChartInstance = new Chart(ctxWorkout, {
    type: 'bar',
    data: {
      labels: ['Cardio', 'Strength', 'Yoga'],
      datasets: [{
        data: [categories.cardio, categories.strength, categories.yoga],
        backgroundColor: ['#22c55e', '#3b82f6', '#a855f7'],
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { borderDash: [4, 4] } }
      }
    }
  });
};

/* ===== Water Tracker Logic ===== */
let dailyWater = 0;
const waterGoal = 8;

window.updateWater = (amount) => {
  dailyWater += amount;
  if (dailyWater < 0) dailyWater = 0;
  if (dailyWater > waterGoal) dailyWater = waterGoal;

  const pct = (dailyWater / waterGoal) * 100;
  
  const countEl = document.getElementById('waterCount');
  const progEl = document.getElementById('waterProgress');
  
  if (countEl) countEl.textContent = `${dailyWater} / ${waterGoal}`;
  if (progEl) progEl.style.width = `${pct}%`;
  
  const today = new Date().toDateString();
  localStorage.setItem('fitlife_water_date', today);
  localStorage.setItem('fitlife_water_count', dailyWater);
};

document.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toDateString();
  const savedDate = localStorage.getItem('fitlife_water_date');
  if (savedDate === today) {
    dailyWater = parseInt(localStorage.getItem('fitlife_water_count')) || 0;
  }
  if (document.getElementById('waterCount')) {
    window.updateWater(0);
  }
});
