// /frontend/js/profile.js
// Load and update user profile

let originalProfile = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  await loadProfile();

  document.getElementById('profileForm').addEventListener('submit', handleProfileUpdate);
  document.getElementById('resetProfileBtn').addEventListener('click', () => {
    if (originalProfile) populateForm(originalProfile);
  });
});

/* ===== Load profile from API ===== */
const loadProfile = async () => {
  const result = await apiFetch('/profile');
  if (!result || !result.ok) return;

  originalProfile = result.data.profile;
  populateForm(originalProfile);
  updateProfileHeader(originalProfile);
};

/* ===== Populate form fields ===== */
const populateForm = (profile) => {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el && val !== null && val !== undefined) el.value = val;
  };
  set('name', profile.name);
  set('age', profile.age);
  set('weight', profile.weight);
  set('height', profile.height);
  set('fitnessGoal', profile.fitnessGoal);
  set('activityLevel', profile.activityLevel);
};

/* ===== Update the profile header card ===== */
const updateProfileHeader = (profile) => {
  // Avatar initials
  const avatar = document.getElementById('profileAvatar');
  if (avatar) {
    const initials = profile.name
      ? profile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
      : '?';
    avatar.textContent = initials;
  }

  const nameEl = document.getElementById('profileName');
  if (nameEl) nameEl.textContent = profile.name || 'Unknown';

  const emailEl = document.getElementById('profileEmail');
  if (emailEl) emailEl.textContent = profile.email || '';

  // BMI calculation
  const bmiEl = document.getElementById('profileBmi');
  if (bmiEl && profile.weight && profile.height) {
    const heightM = profile.height / 100;
    const bmi = (profile.weight / (heightM * heightM)).toFixed(1);
    let bmiLabel = '';
    let bmiColor = '';
    if (bmi < 18.5) { bmiLabel = 'Underweight'; bmiColor = '#3b82f6'; }
    else if (bmi < 25) { bmiLabel = 'Normal'; bmiColor = 'var(--green-600)'; }
    else if (bmi < 30) { bmiLabel = 'Overweight'; bmiColor = 'var(--orange-500)'; }
    else { bmiLabel = 'Obese'; bmiColor = '#ef4444'; }

    bmiEl.innerHTML = `<span class="bmi-indicator" style="background:${bmiColor}20; color:${bmiColor};">
      BMI ${bmi} – ${bmiLabel}
    </span>`;
  }
};

/* ===== Handle profile form submit ===== */
const handleProfileUpdate = async (e) => {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const age = document.getElementById('age').value;
  const weight = document.getElementById('weight').value;
  const height = document.getElementById('height').value;
  const fitnessGoal = document.getElementById('fitnessGoal').value;
  const activityLevel = document.getElementById('activityLevel').value;

  // Basic validation
  if (!name) {
    showAlert('profileError', 'Name cannot be empty.');
    return;
  }

  const btn = document.getElementById('saveProfileBtn');
  btn.textContent = 'Saving...';
  btn.disabled = true;

  try {
    const result = await apiFetch('/profile', {
      method: 'PUT',
      body: JSON.stringify({
        name,
        age: age ? parseInt(age) : null,
        weight: weight ? parseFloat(weight) : null,
        height: height ? parseFloat(height) : null,
        fitnessGoal,
        activityLevel,
      }),
    });

    if (!result) return;

    if (result.ok) {
      originalProfile = result.data.profile;
      updateProfileHeader(originalProfile);

      // Update stored user name
      const user = getUser();
      if (user) {
        user.name = result.data.profile.name;
        localStorage.setItem('fitlife_user', JSON.stringify(user));
        const nameEl = document.getElementById('navUserName');
        if (nameEl) nameEl.textContent = `👋 ${user.name}`;
      }

      showAlert('profileSuccess', 'Profile updated successfully!', 'success');
      showToast('Profile saved!');
    } else {
      showAlert('profileError', result.data.message || 'Failed to update profile.');
    }
  } catch (err) {
    showAlert('profileError', 'Network error.');
  } finally {
    btn.textContent = 'Save Changes';
    btn.disabled = false;
  }
};
