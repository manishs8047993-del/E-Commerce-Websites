// Real-time Order Tracking & History Management
let allLoadedOrders = [];
let currentFilter = 'all';
let ordersAutoPollInterval = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!API.isLoggedIn()) {
    showUnauthenticated();
    return;
  }

  await loadMyOrders();

  // Highlight specific order if queried via URL ?orderId=...
  const urlParams = new URLSearchParams(window.location.search);
  const targetOrderId = urlParams.get('orderId');
  if (targetOrderId) {
    setTimeout(() => {
      const el = document.getElementById(`order-card-${targetOrderId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.border = '2px solid var(--primary)';
        el.style.boxShadow = '0 0 20px rgba(79, 70, 229, 0.25)';
      }
    }, 400);
  }

  // Set up live auto-poll every 6 seconds
  if (ordersAutoPollInterval) clearInterval(ordersAutoPollInterval);
  ordersAutoPollInterval = setInterval(() => {
    loadMyOrders(true); // background silent refresh
  }, 6000);
});

// Load Orders from Server
async function loadMyOrders(isSilent = false) {
  const root = document.getElementById('orders-root');
  const syncIcon = document.getElementById('syncIcon');

  if (syncIcon) syncIcon.classList.add('fa-spin');

  try {
    const res = await API.get('/orders/my-orders');
    allLoadedOrders = res.orders || [];

    if (!isSilent && allLoadedOrders.length === 0) {
      root.innerHTML = `
        <div style="background: var(--bg-card); border-radius: var(--radius-xl); border: 1px dashed var(--border); padding: 4rem 2rem; text-align: center; max-width: 600px; margin: 2rem auto;">
          <i class="fas fa-box-open" style="font-size: 3.5rem; color: var(--text-light); margin-bottom: 1.25rem;"></i>
          <h2 style="margin-bottom: 0.75rem;">No Orders Found</h2>
          <p style="color: var(--text-muted); margin-bottom: 2rem;">You haven't placed any orders yet. Explore our top-tier collection to make your first purchase!</p>
          <a href="/index.html" class="btn btn-primary btn-lg">
            <i class="fas fa-shopping-bag"></i> Start Shopping Now
          </a>
        </div>
      `;
      return;
    }

    renderFilteredOrders();
  } catch (err) {
    if (!isSilent) {
      root.innerHTML = `
        <div style="text-align: center; padding: 4rem 1rem; color: var(--danger);">
          <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
          <h2>Failed to Sync Orders</h2>
          <p style="color: var(--text-muted);">${err.message || 'Please verify your internet or server connection.'}</p>
          <button onclick="loadMyOrders()" class="btn btn-primary btn-sm" style="margin-top: 1rem;">
            <i class="fas fa-redo"></i> Try Again
          </button>
        </div>
      `;
    }
  } finally {
    if (syncIcon) {
      setTimeout(() => syncIcon.classList.remove('fa-spin'), 600);
    }
  }
}

// Expose loadMyOrders globally for notification triggers
window.loadMyOrders = loadMyOrders;

function setStatusFilter(filter, btn) {
  currentFilter = filter;
  document.querySelectorAll('#filterTabs button').forEach(b => {
    b.style.background = 'var(--bg-subtle)';
    b.style.color = 'var(--text-main)';
    b.style.borderColor = 'var(--border)';
  });
  if (btn) {
    btn.style.background = 'var(--primary)';
    btn.style.color = 'white';
    btn.style.borderColor = 'var(--primary)';
  }
  renderFilteredOrders();
}

function filterOrdersList() {
  renderFilteredOrders();
}

function renderFilteredOrders() {
  const root = document.getElementById('orders-root');
  if (!root) return;

  const searchTerm = (document.getElementById('orderSearchInput')?.value || '').toLowerCase().trim();

  let list = allLoadedOrders.filter(order => {
    // Status Filter
    if (currentFilter === 'active') {
      if (order.order_status === 'Delivered' || order.order_status === 'Cancelled') return false;
    } else if (currentFilter === 'Delivered') {
      if (order.order_status !== 'Delivered') return false;
    }

    // Search Filter
    if (searchTerm) {
      const matchNum = String(order.order_number || '').toLowerCase().includes(searchTerm);
      const matchStatus = String(order.order_status || '').toLowerCase().includes(searchTerm);
      const matchItem = (order.items || []).some(i => String(i.product_name || '').toLowerCase().includes(searchTerm));
      const matchCity = String(order.city || '').toLowerCase().includes(searchTerm);
      return matchNum || matchStatus || matchItem || matchCity;
    }

    return true;
  });

  if (list.length === 0) {
    root.innerHTML = `
      <div style="background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border); padding: 3rem 2rem; text-align: center; color: var(--text-muted); margin: 1.5rem 0;">
        <i class="fas fa-search" style="font-size: 2.2rem; color: var(--border); margin-bottom: 0.75rem; display: block;"></i>
        <div style="font-weight: 700; font-size: 1.1rem; color: var(--text-main);">No matching orders found</div>
        <p style="font-size: 0.85rem; margin-top: 0.35rem;">Try adjusting your filter or search keywords.</p>
      </div>
    `;
    return;
  }

  root.innerHTML = list.map(order => renderOrderCard(order)).join('');
}

function renderOrderCard(order) {
  const status = order.order_status || 'Placed';
  const items = order.items || [];

  // Steps calculation for live order tracking progress
  const stepIndexMap = {
    'Placed': 1,
    'Processing': 2,
    'Shipped': 3,
    'Delivered': 4,
    'Cancelled': 0
  };
  const currentStep = stepIndexMap[status] || 1;

  let badgeClass = 'status-placed';
  let badgeIcon = 'fa-clock';
  if (status === 'Processing') { badgeClass = 'status-processing'; badgeIcon = 'fa-box-open'; }
  if (status === 'Shipped') { badgeClass = 'status-shipped'; badgeIcon = 'fa-truck-fast'; }
  if (status === 'Delivered') { badgeClass = 'status-delivered'; badgeIcon = 'fa-check-circle'; }
  if (status === 'Cancelled') { badgeClass = 'status-cancelled'; badgeIcon = 'fa-times-circle'; }

  // Delivery agent details
  const hasAgent = !!(order.delivery_agent_name || order.delivery_agent_id);
  const agentName = order.delivery_agent_name || 'Nova Logistics Partner';
  const agentPhone = order.delivery_agent_phone || '';
  const agentAvatar = order.delivery_agent_avatar;

  return `
    <div class="order-card" id="order-card-${order.id}">
      <div class="order-header">
        <div class="order-meta-group">
          <div class="order-meta-item">
            <span class="meta-label">Order Number</span>
            <span class="meta-value" style="font-family: monospace; color: var(--primary); font-size: 1.05rem;">
              #${order.order_number}
            </span>
          </div>

          <div class="order-meta-item">
            <span class="meta-label">Order Date</span>
            <span class="meta-value">${API.formatDate(order.created_at)}</span>
          </div>

          <div class="order-meta-item">
            <span class="meta-label">Total Payment</span>
            <span class="meta-value" style="font-family: 'Outfit', sans-serif; color: #0f172a;">${API.formatPrice(order.total_amount)}</span>
          </div>

          <div class="order-meta-item">
            <span class="meta-label">Payment Method</span>
            <span class="meta-value" style="font-size: 0.85rem;">
              ${order.payment_method} 
              <span style="color: ${order.payment_status === 'Paid' ? '#059669' : '#d97706'}; font-weight: 800;">
                (${order.payment_status})
              </span>
            </span>
          </div>
        </div>

        <div>
          <span class="status-badge ${badgeClass}">
            <i class="fas ${badgeIcon}"></i> ${status}
          </span>
        </div>
      </div>

      <!-- Live 4-Step Order Tracking Progress Bar -->
      ${status !== 'Cancelled' ? `
        <div class="order-tracker">
          <div class="tracker-step ${currentStep >= 1 ? (currentStep === 1 ? 'active' : 'completed') : ''}">
            <div class="tracker-node"><i class="fas fa-check"></i></div>
            <span class="tracker-label">1. Order Placed</span>
            <span class="tracker-sublabel">Order Received</span>
          </div>

          <div class="tracker-step ${currentStep >= 2 ? (currentStep === 2 ? 'active' : 'completed') : ''}">
            <div class="tracker-node"><i class="fas fa-box"></i></div>
            <span class="tracker-label">2. Processing</span>
            <span class="tracker-sublabel">Packed & Verified</span>
          </div>

          <div class="tracker-step ${currentStep >= 3 ? (currentStep === 3 ? 'active' : 'completed') : ''}">
            <div class="tracker-node"><i class="fas fa-truck-fast"></i></div>
            <span class="tracker-label">3. Shipped</span>
            <span class="tracker-sublabel">Out for Delivery</span>
          </div>

          <div class="tracker-step ${currentStep >= 4 ? 'completed' : ''}">
            <div class="tracker-node"><i class="fas fa-house-chimney-check"></i></div>
            <span class="tracker-label">4. Delivered</span>
            <span class="tracker-sublabel">Package Handed Over</span>
          </div>
        </div>
      ` : `
        <div style="margin: 1.5rem 1.75rem 0 1.75rem; background: var(--danger-light); color: var(--danger); padding: 0.85rem 1.25rem; border-radius: var(--radius-md); font-weight: 700; font-size: 0.9rem; display: flex; align-items: center; gap: 0.5rem;">
          <i class="fas fa-times-circle" style="font-size: 1.1rem;"></i> This order was cancelled.
        </div>
      `}

      <!-- Assigned Courier / Delivery Agent Partner Banner -->
      ${hasAgent ? `
        <div class="delivery-agent-banner">
          <div class="agent-profile-group">
            <div class="agent-avatar">
              ${agentAvatar ? `<img src="${agentAvatar}" alt="${agentName}">` : '<i class="fas fa-motorcycle"></i>'}
            </div>
            <div>
              <div style="font-size: 0.7rem; font-weight: 800; color: #059669; text-transform: uppercase; letter-spacing: 0.04em;">
                <i class="fas fa-shield-check"></i> Assigned Courier Partner
              </div>
              <div style="font-weight: 800; font-size: 1rem; color: #064e3b; margin-top: 0.1rem;">
                ${escapeHtml(agentName)}
              </div>
              <div style="font-size: 0.8rem; color: #047857;">
                Managing transit & doorstep handover for this order.
              </div>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 0.75rem;">
            ${agentPhone ? `
              <a href="tel:${escapeHtml(agentPhone)}" class="btn btn-secondary btn-sm" style="background: white; border-color: #86efac; color: #047857; font-weight: 700;">
                <i class="fas fa-phone-alt"></i> Call Agent: ${escapeHtml(agentPhone)}
              </a>
            ` : `
              <span class="status-pill pill-customer" style="background: white; border: 1px solid #86efac; color: #047857;">
                <i class="fas fa-check"></i> Active Agent Assigned
              </span>
            `}
          </div>
        </div>
      ` : ''}

      <!-- Order Items and Details -->
      <div class="order-body">
        <div class="order-items-list">
          ${items.map(item => `
            <div class="order-item-tile">
              <div style="display: flex; align-items: center; gap: 1rem;">
                <img src="${item.image_url}" alt="${escapeHtml(item.product_name)}" style="width: 58px; height: 58px; border-radius: var(--radius-md); object-fit: contain; background: var(--bg-subtle); border: 1px solid var(--border);">
                <div>
                  <a href="/product.html?id=${item.product_id}" style="font-weight: 700; font-size: 0.95rem; color: var(--text-main); display: block; hover: underline;">
                    ${escapeHtml(item.product_name)}
                  </a>
                  <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">
                    Quantity: <b>${item.quantity}</b> &times; ${API.formatPrice(item.price)}
                  </div>
                </div>
              </div>
              <div style="font-weight: 800; font-family: 'Outfit', sans-serif; font-size: 1.05rem; color: var(--text-main);">
                ${API.formatPrice(item.subtotal || (item.price * item.quantity))}
              </div>
            </div>
          `).join('')}
        </div>

        <div style="margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div style="font-size: 0.85rem; color: var(--text-muted); max-width: 650px;">
            <i class="fas fa-location-dot" style="color: var(--primary);"></i> 
            <b>Ship To:</b> ${escapeHtml(order.recipient_name)} &bull; ${escapeHtml(order.shipping_address)}, ${escapeHtml(order.city)}, ${escapeHtml(order.state)} ${escapeHtml(order.postal_code)} &bull; <b>Phone:</b> ${escapeHtml(order.phone)}
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-secondary btn-sm" onclick="printInvoice('${order.order_number}')">
              <i class="fas fa-print"></i> Print Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function printInvoice(orderNumber) {
  window.print();
}

function showUnauthenticated() {
  const root = document.getElementById('orders-root');
  if (!root) return;

  root.innerHTML = `
    <div style="background: var(--bg-card); border-radius: var(--radius-xl); border: 1px solid var(--border); padding: 4rem 2rem; text-align: center; max-width: 600px; margin: 2rem auto;">
      <i class="fas fa-user-lock" style="font-size: 3.5rem; color: var(--primary); margin-bottom: 1.25rem;"></i>
      <h2 style="margin-bottom: 0.75rem;">Sign In to Track Orders</h2>
      <p style="color: var(--text-muted); margin-bottom: 2rem;">Please sign in to track live shipment milestones, courier updates, and view invoices.</p>
      <a href="/login.html?redirect=/orders.html" class="btn btn-primary btn-lg">
        <i class="fas fa-sign-in-alt"></i> Sign In to Account
      </a>
    </div>
  `;
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
