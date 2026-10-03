// User Auth Logic (Login / Register)

// On page load: clear any leftover admin/staff sessions so customer page is clean
(function clearNonCustomerSession() {
  try {
    const raw = localStorage.getItem('user');
    if (raw) {
      const u = JSON.parse(raw);
      const role = u && u.role ? String(u.role).toLowerCase() : '';
      if (role && role !== 'customer') {
        // Remove stale admin/staff token — they must use the admin portal
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  } catch (e) { /* ignore */ }
})();

function switchAuthTab(mode) {
  const loginTab = document.getElementById('tab-login');
  const registerTab = document.getElementById('tab-register');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const subtitle = document.getElementById('auth-subtitle');

  if (mode === 'login') {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    if (subtitle) subtitle.textContent = 'Welcome back! Please sign in to your account.';
  } else {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    if (subtitle) subtitle.textContent = 'Create an account to start shopping.';
  }
}

// Handle Login Form Submission
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn = document.getElementById('loginSubmitBtn');

  btn.disabled = true;
  btn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Authenticating...`;

  try {
    const res = await API.post('/auth/login', { email, password });

    API.setToken(res.token);
    API.setUser(res.user);

    showToast(res.message || 'Login successful!', 'success');

    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get('redirect') || '/index.html';

    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 1000);
  } catch (err) {
    showToast(err.message || 'Invalid email or password.', 'error');
    btn.disabled = false;
    btn.innerHTML = `<i class="fas fa-arrow-right"></i> Sign In to NovaStore`;
  }
}


// Toggle Show/Hide Password
function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const icon = btn.querySelector('i');
  if (input.type === 'password') {
    input.type = 'text';
    if (icon) {
      icon.classList.remove('fa-eye');
      icon.classList.add('fa-eye-slash');
    }
  } else {
    input.type = 'password';
    if (icon) {
      icon.classList.remove('fa-eye-slash');
      icon.classList.add('fa-eye');
    }
  }
}

// Live Password Strength Checker
function validatePasswordStrength() {
  const password = document.getElementById('regPassword').value;
  const container = document.getElementById('strengthMeterContainer');
  const barFill = document.getElementById('strengthBarFill');
  const label = document.getElementById('strengthLabel');

  if (!password) {
    if (container) container.style.display = 'none';
    resetChecklist();
    return false;
  }

  if (container) container.style.display = 'block';

  // Rule checks
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`§±]/.test(password);

  updateChecklistItem('rule-length', hasMinLength);
  updateChecklistItem('rule-uppercase', hasUppercase);
  updateChecklistItem('rule-lowercase', hasLowercase);
  updateChecklistItem('rule-number', hasNumber);
  updateChecklistItem('rule-special', hasSpecial);

  // Score computation
  let score = 0;
  if (hasMinLength) score++;
  if (hasUppercase) score++;
  if (hasLowercase) score++;
  if (hasNumber) score++;
  if (hasSpecial) score++;

  barFill.className = 'strength-bar-fill';

  if (score <= 2) {
    barFill.classList.add('weak');
    label.textContent = 'Weak';
    label.style.color = 'var(--danger)';
  } else if (score === 3) {
    barFill.classList.add('fair');
    label.textContent = 'Fair';
    label.style.color = 'var(--warning)';
  } else if (score === 4) {
    barFill.classList.add('good');
    label.textContent = 'Good';
    label.style.color = 'var(--info)';
  } else if (score === 5) {
    barFill.classList.add('strong');
    label.textContent = 'Strong & Secure';
    label.style.color = 'var(--success)';
  }

  // Re-verify confirm password match if already typed
  validatePasswordMatch();

  return score === 5;
}

function updateChecklistItem(id, isValid) {
  const el = document.getElementById(id);
  if (!el) return;

  const icon = el.querySelector('i');
  if (isValid) {
    el.classList.remove('invalid');
    el.classList.add('valid');
    if (icon) {
      icon.className = 'fas fa-check-circle';
    }
  } else {
    el.classList.remove('valid');
    el.classList.add('invalid');
    if (icon) {
      icon.className = 'fas fa-circle';
    }
  }
}

function resetChecklist() {
  ['rule-length', 'rule-uppercase', 'rule-lowercase', 'rule-number', 'rule-special'].forEach(id => {
    updateChecklistItem(id, false);
  });
}

// Live Confirm Password Match Validator
function validatePasswordMatch() {
  const password = document.getElementById('regPassword').value;
  const confirmPassword = document.getElementById('regConfirmPassword').value;
  const feedback = document.getElementById('passwordMatchFeedback');

  if (!confirmPassword) {
    if (feedback) {
      feedback.style.display = 'none';
      feedback.textContent = '';
    }
    return false;
  }

  if (feedback) feedback.style.display = 'flex';

  if (password === confirmPassword) {
    feedback.className = 'password-match-badge matched';
    feedback.innerHTML = '<i class="fas fa-check-circle"></i> Passwords match perfectly!';
    return true;
  } else {
    feedback.className = 'password-match-badge mismatched';
    feedback.innerHTML = '<i class="fas fa-times-circle"></i> Passwords do not match.';
    return false;
  }
}

// Handle Register Form Submission
async function handleRegister(e) {
  e.preventDefault();

  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const confirmPassword = document.getElementById('regConfirmPassword').value;
  const phone = document.getElementById('regPhone').value.trim();
  const address = document.getElementById('regAddress').value.trim();
  const city = document.getElementById('regCity').value.trim();
  const state = document.getElementById('regState').value.trim();
  const postal_code = document.getElementById('regPostalCode').value.trim();

  // Validate strong password rules
  if (password.length < 8) {
    showToast('Password must be at least 8 characters long.', 'warning');
    return;
  }
  if (!/[A-Z]/.test(password)) {
    showToast('Password must contain at least 1 uppercase letter (A-Z).', 'warning');
    return;
  }
  if (!/[a-z]/.test(password)) {
    showToast('Password must contain at least 1 lowercase letter (a-z).', 'warning');
    return;
  }
  if (!/[0-9]/.test(password)) {
    showToast('Password must contain at least 1 number (0-9).', 'warning');
    return;
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`§±]/.test(password)) {
    showToast('Password must contain at least 1 special character (e.g. @, #, $, %, !).', 'warning');
    return;
  }

  // Validate matching password
  if (password !== confirmPassword) {
    showToast('Password and Confirm Password do not match!', 'error');
    document.getElementById('regConfirmPassword').focus();
    return;
  }

  const btn = document.getElementById('regSubmitBtn');
  btn.disabled = true;
  btn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Creating Account...`;

  const payload = {
    name,
    email,
    password,
    confirmPassword,
    role: 'customer',
    phone,
    address,
    city,
    state,
    postal_code
  };

  try {
    const res = await API.post('/auth/register', payload);
    API.setToken(res.token);
    API.setUser(res.user);

    showToast(res.message || 'Account created successfully!', 'success');

    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get('redirect') || '/index.html';

    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 1000);
  } catch (err) {
    showToast(err.message || 'Registration failed.', 'error');
    btn.disabled = false;
    btn.innerHTML = `<i class="fas fa-user-plus"></i> Create Customer Account`;
  }
}
