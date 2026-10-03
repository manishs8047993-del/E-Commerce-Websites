// Shared Navbar Component Renderer & Real-time Notifications Hub
let notifPollInterval = null;
let lastKnownNotifCount = null;

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
  renderFooter();
  API.updateCartBadge();
  if (API.isLoggedIn()) {
    initNotifications();
  }
});

function renderNavbar() {
  const navContainer = document.getElementById('navbar-root');
  if (!navContainer) return;

  const user = API.getUser();
  const isLoggedIn = API.isLoggedIn();
  const isAdmin = API.isAdmin();

  let userSectionHtml = '';

  if (isLoggedIn && user) {
    const initials = user.name ? user.name.charAt(0).toUpperCase() : 'U';
    const avatarHtml = user.avatar_url
      ? `<img src="${user.avatar_url}" alt="${user.name}" class="user-avatar-img" onerror="this.onerror=null;this.parentElement.innerHTML='${initials}'">`
      : `${initials}`;

    userSectionHtml = `
      <!-- Notification Bell -->
      <div class="notif-dropdown" style="position: relative;">
        <button class="nav-icon-btn" id="notifBellBtn" onclick="toggleNotifDropdown(event)" title="Notifications & Order Updates">
          <i class="fas fa-bell"></i>
          <span class="notif-badge" id="notifBadge" style="display: none;">0</span>
        </button>

        <div class="notif-menu" id="notifDropdownMenu">
          <div class="notif-header">
            <div style="font-weight: 800; font-size: 0.95rem; display: flex; align-items: center; gap: 0.5rem;">
              <i class="fas fa-bell" style="color: var(--primary);"></i> Notifications
            </div>
            <button onclick="markAllNotifsRead(event)" class="btn-text-link" style="font-size: 0.75rem; color: var(--primary); font-weight: 700; background: none; border: none; cursor: pointer;">
              Mark all read
            </button>
          </div>
          <div class="notif-list" id="notifList">
            <div style="padding: 2rem 1rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
              <i class="fas fa-spinner fa-spin" style="margin-bottom: 0.5rem; display: block; font-size: 1.25rem;"></i>
              Loading updates...
            </div>
          </div>
          <div class="notif-footer">
            <a href="/orders.html" style="font-size: 0.8rem; font-weight: 700; color: var(--primary); display: flex; align-items: center; justify-content: center; gap: 0.4rem;">
              <i class="fas fa-box-open"></i> View All Orders & Tracking
            </a>
          </div>
        </div>
      </div>

      <!-- User Dropdown Menu -->
      <div class="user-dropdown">
        <button class="user-btn" id="userMenuBtn" onclick="toggleUserDropdown(event)">
          <div class="user-avatar">${avatarHtml}</div>
          <span style="max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${user.name.split(' ')[0]}</span>
          <i class="fas fa-chevron-down" style="font-size: 0.75rem;"></i>
        </button>
        <div class="dropdown-menu" id="userDropdownMenu">
          <div style="padding: 0.6rem 0.9rem; border-bottom: 1px solid var(--border-light); margin-bottom: 0.25rem; background: var(--bg-subtle); border-radius: var(--radius-md) var(--radius-md) 0 0;">
            <div style="font-weight: 700; font-size: 0.9rem;">${user.name}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${user.email}</div>
            <div style="display: flex; align-items: center; gap: 0.4rem; margin-top: 0.25rem;">
              <span class="status-pill ${isAdmin ? 'pill-admin' : 'pill-customer'}">
                <i class="fas ${isAdmin ? 'fa-user-shield' : 'fa-user'}"></i> ${user.role || 'Customer'}
              </span>
            </div>
          </div>
          <a href="/profile.html" class="dropdown-item">
            <i class="fas fa-id-badge" style="color: var(--primary);"></i>
            <span>My Profile & Address</span>
          </a>
          <a href="/orders.html" class="dropdown-item">
            <i class="fas fa-box-open" style="color: var(--secondary);"></i>
            <span>View My Orders & Tracker</span>
          </a>
          ${isAdmin ? `
            <a href="/admin.html" class="dropdown-item" style="color: #6366f1; font-weight: 700;">
              <i class="fas fa-tachometer-alt"></i>
              <span>Admin Dashboard</span>
            </a>
          ` : ''}
          <div class="dropdown-divider"></div>
          <button onclick="API.logout()" class="dropdown-item danger" style="width: 100%; text-align: left; background: none; border: none;">
            <i class="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </button>
        </div>
      </div>
    `;
  } else {
    userSectionHtml = `
      <a href="/login.html" class="btn btn-primary btn-sm">
        <i class="fas fa-user"></i>
        <span>Sign In</span>
      </a>
    `;
  }

  navContainer.innerHTML = `
    <nav class="navbar">
      <div class="container nav-container">
        <!-- Logo -->
        <a href="/index.html" class="nav-brand">
          <i class="fas fa-shopping-bag"></i>
          <span>Nova<b>Store</b></span>
        </a>

        <!-- Search Bar -->
        <form class="nav-search" id="navbarSearchForm" onsubmit="handleNavSearch(event)">
          <i class="fas fa-search"></i>
          <input type="text" id="navbarSearchInput" placeholder="Search products, brands, tech..." autocomplete="off">
        </form>

        <!-- Right Action Links -->
        <div class="nav-links">
          <a href="/index.html" class="nav-link">
            <i class="fas fa-compass"></i>
            <span>Explore</span>
          </a>

          ${isLoggedIn ? `
            <a href="/orders.html" class="nav-link">
              <i class="fas fa-receipt"></i>
              <span>My Orders</span>
            </a>
          ` : ''}

          <!-- Cart Button -->
          <a href="/cart.html" class="nav-cart-btn" title="View Shopping Cart">
            <i class="fas fa-shopping-cart"></i>
            <span class="cart-badge" id="nav-cart-badge" style="display: none;">0</span>
          </a>

          <!-- User State -->
          ${userSectionHtml}
        </div>
      </div>
    </nav>
  `;

  // Close dropdowns on outside click
  document.addEventListener('click', (e) => {
    const userMenu = document.getElementById('userDropdownMenu');
    const userBtn = document.getElementById('userMenuBtn');
    if (userMenu && userBtn && !userBtn.contains(e.target) && !userMenu.contains(e.target)) {
      userMenu.classList.remove('show');
    }

    const notifMenu = document.getElementById('notifDropdownMenu');
    const notifBtn = document.getElementById('notifBellBtn');
    if (notifMenu && notifBtn && !notifBtn.contains(e.target) && !notifMenu.contains(e.target)) {
      notifMenu.classList.remove('show');
    }
  });
}

function toggleUserDropdown(event) {
  event.stopPropagation();
  const notifMenu = document.getElementById('notifDropdownMenu');
  if (notifMenu) notifMenu.classList.remove('show');

  const menu = document.getElementById('userDropdownMenu');
  if (menu) {
    menu.classList.toggle('show');
  }
}

function toggleNotifDropdown(event) {
  event.stopPropagation();
  const userMenu = document.getElementById('userDropdownMenu');
  if (userMenu) userMenu.classList.remove('show');

  const menu = document.getElementById('notifDropdownMenu');
  if (menu) {
    const isOpen = menu.classList.toggle('show');
    if (isOpen) {
      loadNotificationsList();
    }
  }
}

// ----------------- Notifications Engine -----------------
async function initNotifications() {
  await fetchNotificationCount();
  if (notifPollInterval) clearInterval(notifPollInterval);
  // Poll every 6 seconds for real-time responsiveness
  notifPollInterval = setInterval(fetchNotificationCount, 6000);
}

async function fetchNotificationCount() {
  if (!API.isLoggedIn()) return;
  try {
    const res = await API.get('/notifications');
    if (res && res.success) {
      const unread = res.unreadCount || 0;
      const badge = document.getElementById('notifBadge');
      if (badge) {
        badge.textContent = unread > 99 ? '99+' : unread;
        badge.style.display = unread > 0 ? 'flex' : 'none';
      }

      // Check if new unread notification arrived
      if (lastKnownNotifCount !== null && unread > lastKnownNotifCount) {
        const latest = (res.notifications || []).find(n => !n.is_read);
        if (latest && typeof showToast === 'function') {
          showToast(`🔔 ${latest.title}: ${latest.message}`, 'info');
        }
        // If user is currently on orders.html, refresh order cards automatically
        if (window.location.pathname.includes('orders.html') && typeof window.loadMyOrders === 'function') {
          window.loadMyOrders(true);
        }
      }
      lastKnownNotifCount = unread;
    }
  } catch (err) {
    // Silent fail on network blip
  }
}

async function loadNotificationsList() {
  const container = document.getElementById('notifList');
  if (!container) return;

  try {
    const res = await API.get('/notifications');
    const list = res.notifications || [];

    if (list.length === 0) {
      container.innerHTML = `
        <div style="padding: 2.5rem 1rem; text-align: center; color: var(--text-muted);">
          <i class="fas fa-bell-slash" style="font-size: 2rem; color: var(--border); margin-bottom: 0.75rem; display: block;"></i>
          <div style="font-weight: 700; font-size: 0.9rem; color: var(--text-main);">No notifications yet</div>
          <div style="font-size: 0.8rem; margin-top: 0.25rem;">We'll notify you here when your order status updates.</div>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(item => {
      const isUnread = !item.is_read || item.is_read === 0 || item.is_read === '0';
      let icon = 'fa-bell';
      let iconColor = 'var(--primary)';
      if (item.type?.includes('shipped')) { icon = 'fa-truck'; iconColor = '#06b6d4'; }
      else if (item.type?.includes('delivered')) { icon = 'fa-check-circle'; iconColor = '#10b981'; }
      else if (item.type?.includes('agent')) { icon = 'fa-motorcycle'; iconColor = '#f59e0b'; }
      else if (item.type?.includes('cancelled')) { icon = 'fa-times-circle'; iconColor = '#ef4444'; }
      else if (item.type?.includes('processing')) { icon = 'fa-box'; iconColor = '#6366f1'; }

      return `
        <div class="notif-item ${isUnread ? 'unread' : ''}" onclick="handleNotifClick(${item.id}, ${item.order_id || 'null'})">
          <div class="notif-icon" style="color: ${iconColor};">
            <i class="fas ${icon}"></i>
          </div>
          <div class="notif-content">
            <div class="notif-title">
              <span>${escapeNavHtml(item.title)}</span>
              ${isUnread ? '<span class="notif-dot"></span>' : ''}
            </div>
            <div class="notif-msg">${escapeNavHtml(item.message)}</div>
            <div class="notif-time">${API.timeAgo(item.created_at)}</div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `
      <div style="padding: 1.5rem; text-align: center; color: var(--danger); font-size: 0.85rem;">
        Failed to load notifications.
      </div>
    `;
  }
}

async function handleNotifClick(notifId, orderId) {
  try {
    await API.put(`/notifications/${notifId}/read`, {});
    fetchNotificationCount();
  } catch (e) {}

  const menu = document.getElementById('notifDropdownMenu');
  if (menu) menu.classList.remove('show');

  if (orderId) {
    window.location.href = `/orders.html?orderId=${orderId}`;
  } else {
    window.location.href = `/orders.html`;
  }
}

async function markAllNotifsRead(event) {
  event.stopPropagation();
  try {
    await API.put('/notifications/read-all', {});
    fetchNotificationCount();
    loadNotificationsList();
    if (typeof showToast === 'function') {
      showToast('All notifications marked as read.', 'success');
    }
  } catch (err) {
    if (typeof showToast === 'function') {
      showToast('Failed to mark notifications read.', 'error');
    }
  }
}

function handleNavSearch(e) {
  e.preventDefault();
  const query = document.getElementById('navbarSearchInput').value.trim();
  if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
    if (typeof window.filterProductsBySearch === 'function') {
      window.filterProductsBySearch(query);
    }
  } else {
    window.location.href = `/index.html?search=${encodeURIComponent(query)}`;
  }
}

function escapeNavHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderFooter() {
  const footerContainer = document.getElementById('footer-root');
  if (!footerContainer) return;

  footerContainer.innerHTML = `
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div>
            <div class="footer-brand">
              <i class="fas fa-shopping-bag" style="color: #6366f1;"></i> Nova<span>Store</span>
            </div>
            <p class="footer-desc">
              Your next-generation premium e-commerce platform offering top-tier smartphones, laptops, formal fashion, gourmet foods, and modern lifestyle essentials.
            </p>
          </div>

          <div>
            <h4 class="footer-title">Popular Categories</h4>
            <ul class="footer-links">
              <li><a href="/index.html?category=sports-fitness">Sports & Fitness</a></li>
              <li><a href="/index.html?category=pet-supplies">Pet Store & Supplies</a></li>
              <li><a href="/index.html?category=food-groceries">Food & Groceries</a></li>
              <li><a href="/index.html?category=healthcare-wellness">Healthcare & Wellness</a></li>
              <li><a href="/index.html?category=beauty-personal-care">Beauty & Personal Care</a></li>
            </ul>
          </div>

          <div>
            <h4 class="footer-title">Customer Care & Admin</h4>
            <ul class="footer-links">
              <li><a href="/orders.html">Track My Order</a></li>
              <li><a href="/cart.html">Shopping Cart</a></li>
              <li><a href="/checkout.html">Cash on Delivery</a></li>
              <li><a href="/login.html">My Account / Sign In</a></li>
            </ul>
          </div>

          <div>
            <h4 class="footer-title">Why Shop With Us</h4>
            <ul class="footer-links">
              <li><span style="color: #cbd5e1; font-size: 0.85rem;"><i class="fas fa-truck" style="color: #6366f1;"></i> Fast Nationwide Delivery</span></li>
              <li><span style="color: #cbd5e1; font-size: 0.85rem;"><i class="fas fa-hand-holding-usd" style="color: #10b981;"></i> Cash on Delivery (COD)</span></li>
              <li><span style="color: #cbd5e1; font-size: 0.85rem;"><i class="fas fa-undo" style="color: #f59e0b;"></i> Easy 30-Day Returns</span></li>
              <li><span style="color: #cbd5e1; font-size: 0.85rem;"><i class="fas fa-shield-alt" style="color: #06b6d4;"></i> 100% Genuine Guarantee</span></li>
            </ul>
          </div>
        </div>

        <div class="footer-bottom">
          <div>© 2026 NovaStore Premium Retail Inc. All rights reserved.</div>
          <div><i class="fas fa-shield-alt" style="color: #10b981;"></i> 100% Secure SSL & Verified Cash on Delivery</div>
        </div>
      </div>
    </footer>
  `;
}
