// /frontend/js/auth.js
// Handles login and registration

document.addEventListener('DOMContentLoaded', () => {
  // Redirect if already logged in
  if (getToken()) {
    window.location.href = '/dashboard.html';
    return;
  }

  /* ===== LOGIN FORM ===== */
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      let valid = true;

      // Client-side validation
      if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        document.getElementById('emailError').style.display = 'block';
        valid = false;
      } else {
        document.getElementById('emailError').style.display = 'none';
      }

      if (!password) {
        document.getElementById('passwordError').style.display = 'block';
        valid = false;
      } else {
        document.getElementById('passwordError').style.display = 'none';
      }

      if (!valid) return;

      const btn = document.getElementById('loginBtn');
      btn.textContent = 'Signing in...';
      btn.disabled = true;

      try {
        const result = await apiFetch('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });

        if (!result) return;

        if (result.ok) {
          setAuth(result.data.token, result.data.user);
          showAlert('loginSuccess', 'Login successful! Redirecting...', 'success');
          setTimeout(() => { window.location.href = '/dashboard.html'; }, 900);
        } else {
          showAlert('loginError', result.data.message || 'Login failed. Check your credentials.');
        }
      } catch (err) {
        showAlert('loginError', 'Network error. Is the server running?');
      } finally {
        btn.textContent = 'Sign In';
        btn.disabled = false;
      }
    });
  }

  /* ===== REGISTER FORM ===== */
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      let valid = true;

      // Validate name
      if (!name) {
        document.getElementById('nameError').style.display = 'block';
        valid = false;
      } else {
        document.getElementById('nameError').style.display = 'none';
      }

      // Validate email
      if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        document.getElementById('emailError').style.display = 'block';
        valid = false;
      } else {
        document.getElementById('emailError').style.display = 'none';
      }

      // Validate password length
      if (!password || password.length < 6) {
        document.getElementById('passwordError').style.display = 'block';
        valid = false;
      } else {
        document.getElementById('passwordError').style.display = 'none';
      }

      // Validate confirm password
      if (password !== confirmPassword) {
        document.getElementById('confirmPasswordError').style.display = 'block';
        valid = false;
      } else {
        document.getElementById('confirmPasswordError').style.display = 'none';
      }

      if (!valid) return;

      const btn = document.getElementById('registerBtn');
      btn.textContent = 'Creating account...';
      btn.disabled = true;

      try {
        const result = await apiFetch('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password }),
        });

        if (!result) return;

        if (result.ok) {
          setAuth(result.data.token, result.data.user);
          showAlert('registerSuccess', 'Account created! Redirecting to dashboard...', 'success');
          setTimeout(() => { window.location.href = '/dashboard.html'; }, 1000);
        } else {
          showAlert('registerError', result.data.message || 'Registration failed.');
        }
      } catch (err) {
        showAlert('registerError', 'Network error. Is the server running?');
      } finally {
        btn.textContent = 'Create Account';
        btn.disabled = false;
      }
    });
  }
});
