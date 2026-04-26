document.addEventListener('DOMContentLoaded', () => {
  // Check auth (optional but good for consistency since it has a sidebar)
  const token = localStorage.getItem('fitlife_token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('fitlife_token');
      localStorage.removeItem('fitlife_user');
      window.location.href = '/login.html';
    });
  }

  // BMI Calculator
  const bmiForm = document.getElementById('bmiForm');
  if (bmiForm) {
    bmiForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const heightCm = parseFloat(document.getElementById('bmiHeight').value);
      const weightKg = parseFloat(document.getElementById('bmiWeight').value);
      
      if (!heightCm || !weightKg) return;
      
      const heightM = heightCm / 100;
      const bmi = weightKg / (heightM * heightM);
      
      let category = '';
      let color = '';
      
      if (bmi < 18.5) {
        category = 'Underweight';
        color = 'var(--blue-500)';
      } else if (bmi >= 18.5 && bmi < 24.9) {
        category = 'Normal weight';
        color = 'var(--neon-green)';
      } else if (bmi >= 25 && bmi < 29.9) {
        category = 'Overweight';
        color = 'var(--orange-500)';
      } else {
        category = 'Obese';
        color = 'var(--red-500)';
      }
      
      const resultDiv = document.getElementById('bmiResult');
      const valueDiv = document.getElementById('bmiValue');
      const categoryDiv = document.getElementById('bmiCategory');
      
      valueDiv.textContent = bmi.toFixed(1);
      valueDiv.style.color = color;
      
      categoryDiv.textContent = category;
      categoryDiv.style.color = color;
      
      resultDiv.style.display = 'block';
    });
  }

  // TDEE Calculator
  const tdeeForm = document.getElementById('tdeeForm');
  if (tdeeForm) {
    tdeeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const age = parseInt(document.getElementById('tdeeAge').value);
      const gender = document.getElementById('tdeeGender').value;
      const heightCm = parseFloat(document.getElementById('tdeeHeight').value);
      const weightKg = parseFloat(document.getElementById('tdeeWeight').value);
      const activityLevel = parseFloat(document.getElementById('tdeeActivity').value);
      
      if (!age || !heightCm || !weightKg) return;
      
      // Mifflin-St Jeor Equation
      let bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
      if (gender === 'male') {
        bmr += 5;
      } else {
        bmr -= 161;
      }
      
      const tdee = bmr * activityLevel;
      
      const resultDiv = document.getElementById('tdeeResult');
      const valueDiv = document.getElementById('tdeeValue');
      
      valueDiv.textContent = Math.round(tdee).toLocaleString();
      resultDiv.style.display = 'block';
    });
  }
});
