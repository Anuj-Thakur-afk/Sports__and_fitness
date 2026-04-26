// /frontend/js/ai.js
// AI Fitness Coach page logic

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;

  // Pre-fill from profile if available
  await prefillFromProfile();

  // Load past suggestions
  await loadHistory();

  // Form submit
  document.getElementById('aiForm').addEventListener('submit', handleAiSubmit);

  // Copy buttons
  document.getElementById('copyWorkoutBtn').addEventListener('click', () => {
    const text = document.getElementById('workoutPlanOutput').textContent;
    copyToClipboard(text, 'Workout plan copied!');
  });

  document.getElementById('copyDietBtn').addEventListener('click', () => {
    const text = document.getElementById('dietSuggestionOutput').textContent;
    copyToClipboard(text, 'Diet suggestions copied!');
  });
});

/* ===== Pre-fill form from user profile ===== */
const prefillFromProfile = async () => {
  const result = await apiFetch('/profile');
  if (!result || !result.ok) return;

  const profile = result.data.profile;

  if (profile.fitnessGoal) {
    const goalSelect = document.getElementById('aiGoal');
    if (goalSelect) goalSelect.value = profile.fitnessGoal;
  }
  if (profile.age) {
    const ageInput = document.getElementById('aiAge');
    if (ageInput) ageInput.value = profile.age;
  }
  if (profile.activityLevel) {
    const actSelect = document.getElementById('aiActivity');
    if (actSelect) actSelect.value = profile.activityLevel;
  }
};

/* ===== Handle AI form submission ===== */
const handleAiSubmit = async (e) => {
  e.preventDefault();

  const goal = document.getElementById('aiGoal').value;
  const age = parseInt(document.getElementById('aiAge').value);
  const activityLevel = document.getElementById('aiActivity').value;

  // Validation
  if (!goal || !age || !activityLevel) {
    showAlert('aiError', 'Please fill in all fields before generating a plan.');
    return;
  }
  if (age < 10 || age > 100) {
    showAlert('aiError', 'Please enter a valid age between 10 and 100.');
    return;
  }

  // Show loading state
  const btn = document.getElementById('generateBtn');
  btn.textContent = '⏳ Generating...';
  btn.disabled = true;

  document.getElementById('initialCard').style.display = 'none';
  document.getElementById('resultCard').style.display = 'none';
  document.getElementById('loadingCard').style.display = 'block';
  document.getElementById('aiError').className = 'alert alert-error';

  try {
    const result = await apiFetch('/ai/suggest', {
      method: 'POST',
      body: JSON.stringify({ goal, age, activityLevel }),
    });

    if (!result) return;

    if (result.ok) {
      const { suggestion } = result.data;
      renderSuggestion(suggestion);
      await loadHistory();
      showToast('Your plan is ready! 🎉');
    } else {
      document.getElementById('initialCard').style.display = 'block';
      showAlert('aiError', result.data.message || 'Failed to generate suggestion.');
    }
  } catch (err) {
    document.getElementById('initialCard').style.display = 'block';
    showAlert('aiError', 'Network error. Please try again.');
  } finally {
    btn.textContent = '🧠 Generate My Plan';
    btn.disabled = false;
    document.getElementById('loadingCard').style.display = 'none';
  }
};

/* ===== Render suggestion output ===== */
const renderSuggestion = (suggestion) => {
  document.getElementById('workoutPlanOutput').textContent = suggestion.workoutPlan || 'No workout plan available.';
  document.getElementById('dietSuggestionOutput').textContent = suggestion.dietSuggestion || 'No diet suggestion available.';
  document.getElementById('resultCard').style.display = 'block';
  document.getElementById('initialCard').style.display = 'none';

  // Smooth scroll to results
  document.getElementById('resultCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
};

/* ===== Load history ===== */
const loadHistory = async () => {
  const result = await apiFetch('/ai/history');
  if (!result || !result.ok) return;

  const { suggestions } = result.data;
  const container = document.getElementById('historyList');

  if (!suggestions.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><p>No history yet.</p></div>`;
    return;
  }

  const goalLabels = {
    lose_weight: '🔥 Lose Weight',
    gain_muscle: '💪 Gain Muscle',
    maintain: '⚖️ Maintain',
    improve_endurance: '🏃 Endurance',
  };

  const activityLabels = {
    sedentary: 'Sedentary',
    light: 'Light',
    moderate: 'Moderate',
    active: 'Active',
    very_active: 'Very Active',
  };

  container.innerHTML = suggestions.map(s => `
    <div class="history-item" data-id="${s._id}">
      <div class="history-meta">${formatDate(s.createdAt)}</div>
      <div class="history-title">${goalLabels[s.goal] || s.goal} · Age ${s.age} · ${activityLabels[s.activityLevel] || s.activityLevel}</div>
    </div>
  `).join('');

  // Click to re-display
  container.querySelectorAll('.history-item').forEach((item, i) => {
    item.addEventListener('click', () => {
      renderSuggestion(suggestions[i]);
    });
  });
};

/* ===== Copy to clipboard ===== */
const copyToClipboard = async (text, successMsg) => {
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMsg);
  } catch {
    showToast('Copy failed — please copy manually.', 'error');
  }
};
