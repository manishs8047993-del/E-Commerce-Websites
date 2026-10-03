// Unified API Client & Utilities
const API = {
  baseUrl: '/api',

  getToken() {
    return localStorage.getItem('token') || null;
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  },

  getUser() {
    const raw = localStorage.getItem('user');
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setUser(user) {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  },

  isLoggedIn() {
    return !!this.getToken() && !!this.getUser();
  },

  isAdmin() {
    const user = this.getUser();
    return user && user.role === 'admin';
  },

  logout() {
    const user = this.getUser();
    const role = user && user.role ? String(user.role).toLowerCase() : 'customer';
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Redirect to appropriate portal based on last role
    if (role === 'admin' || role === 'administrator' || role === 'delivery_agent' || role === 'staff') {
      window.location.href = '/admin-login.html';
    } else {
      window.location.href = '/login.html';
    }
  },

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 && !endpoint.includes('/login') && !endpoint.includes('/register')) {
          // Token expired or invalid
          this.setToken(null);
          this.setUser(null);
        }
        // Attach all server response fields to the error object
        const err = new Error(data.message || 'Request failed');
        Object.assign(err, data);
        throw err;
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  },

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },

  // Helpers
  formatPrice(price) {
    const num = Number(price) || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  },

  formatDate(dateString) {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  async updateCartBadge() {
    const badge = document.getElementById('nav-cart-badge');
    if (!badge) return;

    if (!this.isLoggedIn()) {
      badge.textContent = '0';
      badge.style.display = 'none';
      return;
    }

    try {
      const data = await this.get('/cart');
      if (data && data.summary) {
        const count = data.summary.totalItems || 0;
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
      }
    } catch (err) {
      badge.style.display = 'none';
    }
  },

  timeAgo(dateString) {
    if (!dateString) return '';
    const d = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now - d) / 1000);
    if (diffSec < 45) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return this.formatDate(dateString);
  },

  async quickSwitch(targetRole) {
    try {
      const endpoint = targetRole === 'admin' ? '/auth/admin-login' : '/auth/login';
      const creds = targetRole === 'admin' 
        ? { email: 'admin@ecommerce.com', password: 'admin123' }
        : { email: 'john@example.com', password: 'customer123' };
      const res = await this.post(endpoint, creds);
      this.setToken(res.token);
      this.setUser(res.user);
      if (typeof showToast === 'function') {
        showToast(`Switched account to ${res.user.name} (${res.user.role})!`, 'success');
      }
      setTimeout(() => {
        if (targetRole === 'admin') {
          window.location.href = '/admin.html';
        } else {
          window.location.href = '/orders.html';
        }
      }, 500);
    } catch (err) {
      if (typeof showToast === 'function') {
        showToast('Quick switch failed: ' + err.message, 'error');
      }
    }
  }
};
