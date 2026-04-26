// /frontend/js/goal.js
// Daily goal tracker logic

let currentGoal = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;

  // Set date input to today
  const dateInput = document.getElementById('goalDate');
  dateInput.value = todayStr();
  dateInput.max = todayStr();

  updateDateLabel();
  await loadGoal(todayStr());

  // Event listeners
  document.getElementById('todayBtn').addEventListener('click', () => {
    dateInput.value = todayStr();
    updateDateLabel();
    loadGoal(todayStr());
  });

  dateInput.addEventListener('change', () => {
    updateDateLabel();
    loadGoal(dateInput.value);
  });

  document.getElementById('goalForm').addEventListener('submit', handleGoalSubmit);
  document.getElementById('updateProgressBtn').addEventListener('click', handleQuickProgress);

  // Allow Enter key in quick progress
  document.getElementById('quickProgress').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleQuickProgress();
  });
});

const updateDateLabel = () => {
  const dateInput = document.getElementById('goalDate');
  const label = document.getElementById('goalDateLabel');
  const d = new Date(dateInput.value + 'T00:00:00');
  label.textContent = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
};

/* ===== Load Goal ===== */
const loadGoal = async (date) => {
  const result = await apiFetch(`/goals?date=${date}`);
  if (!result || !result.ok) return;

  currentGoal = result.data.goal;
  renderGoalProgress(currentGoal);
  populateGoalForm(currentGoal);
};

const renderGoalProgress = (goal) => {
  const noGoalMsg = document.getElementById('noGoalMsg');
  const progressPct = document.getElementById('progressPct');
  const progressLabel = document.getElementById('progressLabel');
  const progressStatus = document.getElementById('progressStatus');
  const progressBar = document.getElementById('progressBar');

  if (!goal) {
    noGoalMsg.style.display = 'block';
    progressPct.textContent = '—';
    progressLabel.textContent = 'No goal set';
    progressStatus.textContent = '';
    progressBar.style.width = '0%';
    progressBar.className = 'progress-bar-fill';
    return;
  }

  noGoalMsg.style.display = 'none';

  const pct = goal.calorieGoal > 0
    ? Math.round((goal.calorieProgress / goal.calorieGoal) * 100)
    : 0;
  const displayPct = Math.min(pct, 100);

  progressPct.textContent = `${pct}%`;
  progressLabel.textContent = `${goal.calorieProgress.toLocaleString()} / ${goal.calorieGoal.toLocaleString()} kcal`;

  // Color & status
  let fillClass = '';
  let statusText = '';
  if (pct >= 100) {
    fillClass = '';
    statusText = '🎉 Goal Reached!';
    progressPct.style.color = 'var(--green-600)';
  } else if (pct >= 75) {
    fillClass = 'warning';
    statusText = '🔥 Almost there!';
    progressPct.style.color = 'var(--orange-500)';
  } else {
    statusText = 'Keep going! 💪';
    progressPct.style.color = 'var(--green-600)';
  }

  progressStatus.textContent = statusText;
  progressBar.style.width = `${displayPct}%`;
  progressBar.className = `progress-bar-fill ${fillClass}`;
};

const populateGoalForm = (goal) => {
  if (!goal) {
    document.getElementById('calorieGoal').value = '';
    document.getElementById('calorieProgress').value = '';
    document.getElementById('goalNotes').value = '';
    return;
  }
  document.getElementById('calorieGoal').value = goal.calorieGoal || '';
  document.getElementById('calorieProgress').value = goal.calorieProgress || '';
  document.getElementById('goalNotes').value = goal.notes || '';
};

/* ===== Submit Goal ===== */
const handleGoalSubmit = async (e) => {
  e.preventDefault();

  const calorieGoal = parseInt(document.getElementById('calorieGoal').value);
  const calorieProgress = parseInt(document.getElementById('calorieProgress').value) || 0;
  const notes = document.getElementById('goalNotes').value.trim();
  const date = document.getElementById('goalDate').value;

  if (!calorieGoal || calorieGoal < 100) {
    showAlert('goalError', 'Please enter a valid calorie goal (min 100).');
    return;
  }

  const btn = e.submitter;
  btn.textContent = 'Saving...';
  btn.disabled = true;

  try {
    const result = await apiFetch('/goals', {
      method: 'POST',
      body: JSON.stringify({ calorieGoal, calorieProgress, notes, date }),
    });

    if (!result) return;

    if (result.ok) {
      currentGoal = result.data.goal;
      renderGoalProgress(currentGoal);
      showAlert('goalSuccess', 'Goal saved!', 'success');
      showToast('Goal saved!');
    } else {
      showAlert('goalError', result.data.message || 'Failed to save goal.');
    }
  } catch (err) {
    showAlert('goalError', 'Network error.');
  } finally {
    btn.textContent = 'Save Goal';
    btn.disabled = false;
  }
};

/* ===== Quick Progress Update ===== */
const handleQuickProgress = async () => {
  const addAmount = parseInt(document.getElementById('quickProgress').value);
  if (!addAmount || addAmount <= 0) {
    showToast('Enter a valid calorie amount.', 'error');
    return;
  }

  if (!currentGoal) {
    showToast('Set a goal first!', 'error');
    return;
  }

  const newProgress = (currentGoal.calorieProgress || 0) + addAmount;
  const date = document.getElementById('goalDate').value;

  const result = await apiFetch('/goals/progress', {
    method: 'PUT',
    body: JSON.stringify({ calorieProgress: newProgress, date }),
  });

  if (!result) return;

  if (result.ok) {
    currentGoal = result.data.goal;
    renderGoalProgress(currentGoal);
    populateGoalForm(currentGoal);
    document.getElementById('quickProgress').value = '';
    showToast(`Added ${addAmount} kcal to progress!`);
  } else {
    showToast(result.data.message || 'Failed to update progress.', 'error');
  }
};
