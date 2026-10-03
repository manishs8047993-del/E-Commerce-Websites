// Profile Management Logic
document.addEventListener('DOMContentLoaded', async () => {
  if (!API.isLoggedIn()) {
    showToast('Please sign in to access your profile settings.', 'warning');
    setTimeout(() => {
      window.location.href = '/login.html?redirect=/profile.html';
    }, 1000);
    return;
  }

  await loadUserProfile();
});

async function loadUserProfile() {
  try {
    const res = await API.get('/auth/me');
    const user = res.user || API.getUser();
    if (!user) return;

    // Populate Sidebar
    document.getElementById('sidebarName').textContent = user.name || 'User';
    document.getElementById('sidebarEmail').textContent = user.email || '';

    const roleBadge = document.getElementById('sidebarRoleBadge');
    const quickLinks = document.getElementById('quickActionLinks');

    if (user.role === 'admin') {
      roleBadge.className = 'profile-role-pill role-pill-admin';
      roleBadge.innerHTML = '<i class="fas fa-user-shield"></i> Verified Administrator';
      quickLinks.innerHTML = `
        <a href="/admin.html" class="btn btn-secondary btn-sm" style="color: #6366f1; border-color: #c7d2fe;">
          <i class="fas fa-tachometer-alt"></i> Admin Dashboard
        </a>
        <a href="/orders.html" class="btn btn-secondary btn-sm">
          <i class="fas fa-box-open"></i> Customer Orders Feed
        </a>
      `;
    } else {
      roleBadge.className = 'profile-role-pill role-pill-customer';
      roleBadge.innerHTML = '<i class="fas fa-user"></i> Customer Member';
      quickLinks.innerHTML = `
        <a href="/orders.html" class="btn btn-secondary btn-sm">
          <i class="fas fa-box-open"></i> View My Orders
        </a>
        <a href="/cart.html" class="btn btn-secondary btn-sm">
          <i class="fas fa-shopping-cart"></i> My Shopping Cart
        </a>
      `;
    }

    // Set Avatar Photo
    const avatarImg = document.getElementById('sidebarAvatar');
    const defaultAvatar = user.role === 'admin'
      ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80';

    avatarImg.src = user.avatar_url || defaultAvatar;
    document.getElementById('profileAvatarInput').value = user.avatar_url || '';

    // Populate Form Fields
    document.getElementById('profileName').value = user.name || '';
    document.getElementById('profileEmail').value = user.email || '';
    document.getElementById('profilePhone').value = user.phone || '';
    document.getElementById('profileAddress').value = user.address || '';
    document.getElementById('profileCity').value = user.city || '';
    document.getElementById('profileState').value = user.state || '';
    document.getElementById('profilePostalCode').value = user.postal_code || '';

  } catch (err) {
    showToast('Failed to load profile details.', 'error');
  }
}

// ─── Upload Real Photo from Device ───────────────────────────────────────────
async function handleDevicePhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Validate file type
  if (!file.type.startsWith('image/')) {
    showToast('Please select a valid image file (JPG, PNG, GIF, WebP).', 'warning');
    return;
  }

  // Validate file size (max 8 MB)
  const MAX_SIZE_MB = 8;
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    showToast(`Image is too large. Please choose a file under ${MAX_SIZE_MB} MB.`, 'warning');
    return;
  }

  const btn = document.getElementById('uploadDeviceBtn');
  const progressBar = document.getElementById('uploadProgressBar');
  const progressFill = document.getElementById('uploadProgressFill');
  const statusMsg = document.getElementById('uploadStatusMsg');

  // Show progress UI
  btn.disabled = true;
  btn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Uploading...`;
  progressBar.style.display = 'block';
  progressFill.style.width = '0%';
  statusMsg.textContent = 'Reading file…';

  try {
    // Step 1: Read the file as Base64 via FileReader
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Failed to read the image file.'));
      reader.readAsDataURL(file);
    });

    progressFill.style.width = '40%';
    statusMsg.textContent = 'Uploading to server…';

    // Show a live preview immediately (optimistic UI)
    document.getElementById('sidebarAvatar').src = base64;

    progressFill.style.width = '70%';

    // Step 2: POST base64 image to backend — saves to disk & DB
    const res = await API.post('/auth/upload-avatar', { image: base64 });

    progressFill.style.width = '100%';
    statusMsg.innerHTML = `<span style="color:#10b981;"><i class="fas fa-check-circle"></i> Photo saved successfully!</span>`;

    // Step 3: Sync user object and update UI everywhere
    if (res.user) {
      API.setUser(res.user);
      document.getElementById('sidebarAvatar').src = res.avatar_url || base64;
      document.getElementById('profileAvatarInput').value = res.avatar_url || '';
    }

    if (typeof renderNavbar === 'function') renderNavbar();
    showToast('📸 Profile photo uploaded & saved!', 'success');

  } catch (err) {
    statusMsg.innerHTML = `<span style="color:#ef4444;"><i class="fas fa-times-circle"></i> Upload failed. Try again.</span>`;
    showToast(err.message || 'Photo upload failed. Please try again.', 'error');
    // Revert preview on failure
    const user = API.getUser();
    if (user && user.avatar_url) {
      document.getElementById('sidebarAvatar').src = user.avatar_url;
    }
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="fas fa-folder-open"></i> Upload Photo from Device`;
    // Hide progress bar after 2.5s
    setTimeout(() => {
      progressBar.style.display = 'none';
      progressFill.style.width = '0%';
    }, 2500);
    // Reset file input so the same file can be re-selected
    event.target.value = '';
  }
}

// Preview Avatar URL live
function previewAvatarUrl(url) {
  const avatarImg = document.getElementById('sidebarAvatar');
  if (url && url.trim() !== '') {
    avatarImg.src = url.trim();
  }
}

// Select quick preset avatar
function selectPresetAvatar(url) {
  document.getElementById('profileAvatarInput').value = url;
  previewAvatarUrl(url);
  showToast('Preset avatar selected! Click Save to apply.', 'info');
}

// Handle Profile Update Form Submission
async function handleProfileUpdate(e) {
  e.preventDefault();

  const name = document.getElementById('profileName').value.trim();
  const avatar_url = document.getElementById('profileAvatarInput').value.trim();
  const phone = document.getElementById('profilePhone').value.trim();
  const address = document.getElementById('profileAddress').value.trim();
  const city = document.getElementById('profileCity').value.trim();
  const state = document.getElementById('profileState').value.trim();
  const postal_code = document.getElementById('profilePostalCode').value.trim();

  if (!name) {
    showToast('Full name is required.', 'warning');
    return;
  }

  const btn = document.getElementById('saveProfileBtn');
  btn.disabled = true;
  btn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Saving Changes...`;

  try {
    const payload = { name, avatar_url: avatar_url || null, phone, address, city, state, postal_code };
    const res = await API.put('/auth/profile', payload);
    API.setUser(res.user);

    showToast(res.message || 'Profile & photo updated successfully!', 'success');

    document.getElementById('sidebarName').textContent = res.user.name;
    if (res.user.avatar_url) {
      document.getElementById('sidebarAvatar').src = res.user.avatar_url;
    }

    renderNavbar();

    btn.disabled = false;
    btn.innerHTML = `<i class="fas fa-save"></i> Save Profile & Photo Changes`;
  } catch (err) {
    showToast(err.message || 'Failed to update profile.', 'error');
    btn.disabled = false;
    btn.innerHTML = `<i class="fas fa-save"></i> Save Profile & Photo Changes`;
  }
}
