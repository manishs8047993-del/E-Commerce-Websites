// Admin Dashboard Core Logic
let adminCategories = [];
let allAdminProducts = [];
let allAdminOrders = [];
let allAdminCustomers = [];
let allAdminPayments = [];
let allAdminStaff = [];

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Check local session
  if (!API.isLoggedIn()) {
    showToast('Please sign in with authorized staff or administrator credentials.', 'warning');
    setTimeout(() => {
      window.location.href = '/admin-login.html';
    }, 800);
    return;
  }

  // 2. Validate token and role against server
  try {
    const meRes = await API.get('/auth/me');
    const allowedRoles = ['admin', 'administrator', 'delivery_agent', 'staff'];
    if (!meRes || !meRes.user || !allowedRoles.includes(meRes.user.role)) {
      showToast('Customer account detected. Please sign in with staff credentials.', 'warning');
      API.logout();
      setTimeout(() => {
        window.location.href = '/admin-login.html';
      }, 1200);
      return;
    }
    // Update synced user
    API.setUser(meRes.user);
  } catch (err) {
    showToast('Staff session expired. Please sign in again.', 'warning');
    API.logout();
    setTimeout(() => {
      window.location.href = '/admin-login.html';
    }, 1000);
    return;
  }

  // 3. Set User & Role Info in sidebar and topbar
  const user = API.getUser();
  const isDeliveryAgent = user && user.role === 'delivery_agent';

  if (user) {
    const userRoleText = isDeliveryAgent ? 'Delivery Executive' : 'Administrator';
    document.getElementById('adminUserName').textContent = user.name || (isDeliveryAgent ? 'Delivery Agent' : 'Admin');
    document.getElementById('adminAvatarInitial').textContent = (user.name || (isDeliveryAgent ? 'D' : 'A')).charAt(0).toUpperCase();

    // Adapt sidebar for delivery agent
    if (isDeliveryAgent) {
      document.querySelector('.admin-brand span').innerHTML = `Nova<b>Logistics</b> <small style="font-size: 0.65rem; background: #059669; padding: 2px 6px; border-radius: 4px; vertical-align: middle;">DELIVERY</small>`;
      
      const hideNavIds = ['navBtnAddProduct', 'navBtnProducts', 'navBtnCategories', 'navBtnStaff', 'navBtnPayments', 'navBtnReports'];
      hideNavIds.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.style.display = 'none';
      });

      const ordersBtn = document.getElementById('navBtnOrders');
      if (ordersBtn) ordersBtn.innerHTML = `<i class="fas fa-truck"></i> Deliveries & Orders`;

      const custBtn = document.getElementById('navBtnCustomers');
      if (custBtn) custBtn.innerHTML = `<i class="fas fa-map-marker-alt"></i> Customer Addresses`;
    }
  }

  // 4. Load role-appropriate initial data
  await loadCategories();
  await loadDashboardStats();
  await loadAdminOrders();
  await loadAdminCustomers();

  if (!isDeliveryAgent) {
    await loadAdminProducts();
    await loadAdminPayments();
    await loadAdminReports();
    await loadAdminStaff();
  }

  // 5. Handle deep linking tab (e.g. admin.html?tab=orders)
  const urlParams = new URLSearchParams(window.location.search);
  const requestedTab = urlParams.get('tab') || (isDeliveryAgent ? 'orders' : 'dashboard');
  switchAdminTab(requestedTab);
});

// Tab Switching
function switchAdminTab(tabName, btnElement) {
  // Update Tab buttons
  document.querySelectorAll('.admin-nav-item').forEach(btn => {
    btn.classList.remove('active');
  });
  if (btnElement) {
    btnElement.classList.add('active');
  } else {
    // Find matching button
    const matching = Array.from(document.querySelectorAll('.admin-nav-item')).find(b => b.getAttribute('onclick')?.includes(tabName));
    if (matching) matching.classList.add('active');
  }

  // Update Panes
  document.querySelectorAll('.tab-pane').forEach(pane => {
    pane.classList.remove('active');
  });
  const activePane = document.getElementById(`tab-${tabName}`);
  if (activePane) {
    activePane.classList.add('active');
  }

  // Update Topbar Title
  const user = API.getUser();
  const isDelivery = user && user.role === 'delivery_agent';
  const titles = {
    'dashboard': isDelivery ? 'Logistics Dashboard & Metrics' : 'Dashboard Overview',
    'add-product': 'Add New Product',
    'products': 'Store Products Inventory',
    'categories': 'Manage Store Categories',
    'orders': isDelivery ? 'Deliveries & Order Status' : 'Customer Orders Management',
    'customers': isDelivery ? 'Customer Drop-off Addresses & Contacts' : 'Registered Customers Directory',
    'staff': 'Staff & Role-Based Access Control',
    'payments': 'Payment Transactions & Ledger',
    'reports': 'Sales Analytics & Reports'
  };
  const titleElem = document.getElementById('topbarTitle');
  if (titleElem && titles[tabName]) {
    titleElem.textContent = titles[tabName];
  }
}

// 1. Load Dashboard Overview Stats
async function loadDashboardStats() {
  try {
    const res = await API.get('/admin/stats');
    if (res && res.stats) {
      const s = res.stats;
      document.getElementById('statRevenue').textContent = API.formatPrice(s.totalRevenue);
      document.getElementById('statOrders').textContent = s.totalOrders || 0;
      document.getElementById('statProducts').textContent = s.totalProducts || 0;
      document.getElementById('statCustomers').textContent = s.totalCustomers || 0;

      // Render recent orders
      renderRecentOrders(s.recentOrders || []);
    }
  } catch (err) {
    console.error('Failed to load admin stats:', err);
  }
}

function renderRecentOrders(orders) {
  const tbody = document.getElementById('recentOrdersTbody');
  if (!tbody) return;

  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">No orders placed yet.</td></tr>';
    return;
  }

  tbody.innerHTML = orders.map(o => `
    <tr>
      <td style="font-family: monospace; font-weight: 700; color: var(--primary);">#${o.order_number}</td>
      <td>
        <div style="font-weight: 600;">${o.recipient_name || o.customer_name || 'Customer'}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">${o.customer_email || ''}</div>
      </td>
      <td style="color: var(--text-muted); font-size: 0.85rem;">${API.formatDate(o.created_at)}</td>
      <td style="font-weight: 700;">${API.formatPrice(o.total_amount)}</td>
      <td><span style="font-size: 0.8rem; font-weight: 600;">${o.payment_method}</span></td>
      <td><span class="badge-status badge-${o.order_status}">${o.order_status}</span></td>
      <td>
        <button onclick="openOrderDetailModal(${o.id})" class="btn btn-secondary btn-sm" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">
          <i class="fas fa-eye"></i> View
        </button>
      </td>
    </tr>
  `).join('');
}

// 2. Load Categories
async function loadCategories() {
  try {
    const res = await API.get('/admin/categories');
    adminCategories = res.categories || [];
    
    // Select dropdown in Add Product
    const select = document.getElementById('prodCategory');
    if (select) {
      select.innerHTML = '<option value="">Select Category...</option>' + 
        adminCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }

    // Table in Manage Categories Tab
    renderCategoriesTable(adminCategories);
  } catch (err) {
    console.error('Failed to load categories:', err);
  }
}

function renderCategoriesTable(categories) {
  const tbody = document.getElementById('categoriesTbody');
  if (!tbody) return;

  if (categories.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No categories created.</td></tr>';
    return;
  }

  tbody.innerHTML = categories.map(c => `
    <tr>
      <td><i class="${c.icon || 'fas fa-box'}" style="color: var(--primary); font-size: 1.1rem;"></i></td>
      <td style="font-weight: 700;">${c.name}</td>
      <td style="font-family: monospace; color: var(--text-muted);">${c.slug}</td>
      <td><span style="font-weight: 700; background: #e0e7ff; color: #4338ca; padding: 0.2rem 0.6rem; border-radius: 999px;">${c.product_count || 0} products</span></td>
      <td>
        <button onclick="deleteCategory(${c.id}, '${c.name.replace(/'/g, "\\'")}')" class="btn btn-danger btn-sm" style="padding: 0.25rem 0.5rem; background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5;">
          <i class="fas fa-trash-alt"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

async function handleAddCategory(e) {
  e.preventDefault();
  const name = document.getElementById('catName').value.trim();
  const icon = document.getElementById('catIcon').value.trim();
  const description = document.getElementById('catDescription').value.trim();

  try {
    await API.post('/admin/categories', { name, icon, description });
    showToast(`Category "${name}" created!`, 'success');
    document.getElementById('addCategoryForm').reset();
    await loadCategories();
  } catch (err) {
    showToast(err.message || 'Failed to add category.', 'error');
  }
}

async function deleteCategory(id, name) {
  if (!confirm(`Delete category "${name}"? Products in this category will become uncategorized.`)) return;
  try {
    await API.delete(`/admin/categories/${id}`);
    showToast(`Category deleted.`, 'success');
    await loadCategories();
  } catch (err) {
    showToast(err.message || 'Failed to delete category.', 'error');
  }
}

// 3. Products Management (Load, Filter, Delete, Edit)
async function loadAdminProducts() {
  try {
    const res = await API.get('/products?limit=200');
    allAdminProducts = res.products || [];
    renderAdminProducts(allAdminProducts);
  } catch (err) {
    console.error('Failed to load admin products:', err);
  }
}

function renderAdminProducts(products) {
  const tbody = document.getElementById('productsTbody');
  if (!tbody) return;

  if (products.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No products found.</td></tr>';
    return;
  }

  tbody.innerHTML = products.map(p => `
    <tr>
      <td>
        <div style="display: flex; align-items: center; gap: 0.85rem;">
          <img src="${p.image_url}" alt="${p.name}" style="width: 44px; height: 44px; object-fit: contain; border-radius: var(--radius-sm); border: 1px solid var(--border); background: #f8fafc;">
          <div>
            <div style="font-weight: 700; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.name}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${p.brand || 'Store Brand'} ${p.is_featured ? '• <span style="color:#d97706;font-weight:700;">Featured</span>' : ''}</div>
          </div>
        </div>
      </td>
      <td><span style="font-size: 0.85rem; background: var(--bg-subtle); padding: 0.2rem 0.6rem; border-radius: 4px;">${p.category_name || 'General'}</span></td>
      <td style="font-weight: 700;">${API.formatPrice(p.price)}</td>
      <td>
        <span style="font-weight: 600; color: ${p.stock < 5 ? '#ef4444' : '#10b981'};">
          ${p.stock} in stock
        </span>
      </td>
      <td><span style="color: #f59e0b; font-weight: 700;"><i class="fas fa-star"></i> ${p.rating || 5.0}</span></td>
      <td>
        <div style="display: flex; gap: 0.4rem;">
          <button onclick="editProduct(${p.id})" class="btn btn-secondary btn-sm" title="Edit Product" style="padding: 0.35rem 0.6rem;">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="deleteProduct(${p.id}, '${p.name.replace(/'/g, "\\'")}')" class="btn btn-danger btn-sm" title="Delete Product" style="padding: 0.35rem 0.6rem; background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5;">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterProductsTable() {
  const query = (document.getElementById('productSearchInput')?.value || '').toLowerCase().trim();
  const filtered = allAdminProducts.filter(p => 
    p.name.toLowerCase().includes(query) || 
    (p.brand && p.brand.toLowerCase().includes(query)) ||
    (p.category_name && p.category_name.toLowerCase().includes(query))
  );
  renderAdminProducts(filtered);
}

function previewProductImage(url) {
  const container = document.getElementById('imagePreviewContainer');
  const img = document.getElementById('imagePreviewImg');
  if (url && url.startsWith('http')) {
    img.src = url;
    container.style.display = 'block';
  } else {
    container.style.display = 'none';
  }
}

// 4. Add & Edit Product Submit
async function handleProductSubmit(e) {
  e.preventDefault();
  const editId = document.getElementById('editProductId').value;
  const isEditing = !!editId;

  const productData = {
    name: document.getElementById('prodName').value.trim(),
    category_id: parseInt(document.getElementById('prodCategory').value),
    brand: document.getElementById('prodBrand').value.trim(),
    price: parseFloat(document.getElementById('prodPrice').value),
    original_price: document.getElementById('prodOriginalPrice').value ? parseFloat(document.getElementById('prodOriginalPrice').value) : null,
    stock: parseInt(document.getElementById('prodStock').value) || 0,
    image_url: document.getElementById('prodImageUrl').value.trim(),
    description: document.getElementById('prodDescription').value.trim(),
    is_featured: document.getElementById('prodFeatured').checked ? 1 : 0
  };

  const saveBtn = document.getElementById('saveProductBtn');
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Saving...';

  try {
    if (isEditing) {
      await API.put(`/admin/products/${editId}`, productData);
      showToast('Product updated successfully!', 'success');
    } else {
      await API.post('/admin/products', productData);
      showToast('New product added to store!', 'success');
    }

    resetProductForm();
    await loadAdminProducts();
    await loadDashboardStats();
    switchAdminTab('products');
  } catch (err) {
    showToast(err.message || 'Failed to save product.', 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Product';
  }
}

function editProduct(productId) {
  const prod = allAdminProducts.find(p => p.id === productId);
  if (!prod) return;

  document.getElementById('editProductId').value = prod.id;
  document.getElementById('prodName').value = prod.name;
  document.getElementById('prodCategory').value = prod.category_id || '';
  document.getElementById('prodBrand').value = prod.brand || '';
  document.getElementById('prodPrice').value = prod.price;
  document.getElementById('prodOriginalPrice').value = prod.original_price || '';
  document.getElementById('prodStock').value = prod.stock;
  document.getElementById('prodImageUrl').value = prod.image_url;
  document.getElementById('prodDescription').value = prod.description || '';
  document.getElementById('prodFeatured').checked = !!prod.is_featured;

  previewProductImage(prod.image_url);

  document.getElementById('productFormHeading').innerHTML = `<i class="fas fa-edit" style="color: var(--primary);"></i> Edit Product: ${prod.name}`;
  document.getElementById('saveProductBtn').innerHTML = '<i class="fas fa-check"></i> Update Product';

  switchAdminTab('add-product');
}

function resetProductForm() {
  document.getElementById('addProductForm').reset();
  document.getElementById('editProductId').value = '';
  document.getElementById('imagePreviewContainer').style.display = 'none';
  document.getElementById('productFormHeading').innerHTML = '<i class="fas fa-plus-circle" style="color: var(--primary);"></i> Add New Product to Store';
  document.getElementById('saveProductBtn').innerHTML = '<i class="fas fa-save"></i> Save Product';
}

async function deleteProduct(productId, productName) {
  if (!confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
    return;
  }

  try {
    await API.delete(`/admin/products/${productId}`);
    showToast(`Product deleted successfully.`, 'success');
    await loadAdminProducts();
    await loadDashboardStats();
  } catch (err) {
    showToast(err.message || 'Failed to delete product.', 'error');
  }
}

// 5. Orders Management (Load, Filter, Update Status)
async function loadAdminOrders() {
  try {
    const status = document.getElementById('orderStatusFilter')?.value || 'all';
    const search = document.getElementById('orderSearchInput')?.value || '';

    let endpoint = `/admin/orders?status=${status}`;
    if (search.trim()) {
      endpoint += `&search=${encodeURIComponent(search.trim())}`;
    }

    const res = await API.get(endpoint);
    allAdminOrders = res.orders || [];
    renderAdminOrders(allAdminOrders);
  } catch (err) {
    console.error('Failed to load admin orders:', err);
  }
}

function renderAdminOrders(orders) {
  const tbody = document.getElementById('ordersTbody');
  if (!tbody) return;

  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">No matching orders found.</td></tr>';
    return;
  }

  tbody.innerHTML = orders.map(o => `
    <tr>
      <td style="font-family: monospace; font-weight: 700; color: var(--primary);">#${o.order_number}</td>
      <td>
        <div style="font-weight: 700;">${o.recipient_name}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">${o.phone}</div>
      </td>
      <td>${o.city}, ${o.state}</td>
      <td style="font-weight: 800; font-size: 0.95rem;">${API.formatPrice(o.total_amount)}</td>
      <td>
        <div><span style="font-size: 0.8rem; font-weight: 600;">${o.payment_method}</span></div>
        <span style="font-size: 0.7rem; color: ${o.payment_status === 'Paid' ? '#059669' : '#d97706'}; font-weight: 700;">${o.payment_status}</span>
      </td>
      <td>
        <select onchange="updateOrderStatusInline(${o.id}, this.value)" class="form-control" style="padding: 0.3rem 0.6rem; font-size: 0.8rem; font-weight: 700; width: 130px;">
          <option value="Placed" ${o.order_status === 'Placed' ? 'selected' : ''}>Placed</option>
          <option value="Processing" ${o.order_status === 'Processing' ? 'selected' : ''}>Processing</option>
          <option value="Shipped" ${o.order_status === 'Shipped' ? 'selected' : ''}>Shipped</option>
          <option value="Delivered" ${o.order_status === 'Delivered' ? 'selected' : ''}>Delivered</option>
          <option value="Cancelled" ${o.order_status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>
      </td>
      <td>
        <button onclick="openOrderDetailModal(${o.id})" class="btn btn-secondary btn-sm" style="padding: 0.35rem 0.7rem; font-size: 0.8rem;">
          <i class="fas fa-eye"></i> Details
        </button>
      </td>
    </tr>
  `).join('');
}

async function updateOrderStatusInline(orderId, newStatus) {
  try {
    await API.put(`/admin/orders/${orderId}/status`, { order_status: newStatus });
    showToast(`Order status updated to "${newStatus}"!`, 'success');
    await loadDashboardStats();
    await loadAdminPayments();
    await loadAdminReports();
  } catch (err) {
    showToast(err.message || 'Failed to update order status.', 'error');
    loadAdminOrders();
  }
}

// Order Modal Detail
function openOrderDetailModal(orderId) {
  const order = allAdminOrders.find(o => o.id === orderId) || (document.getElementById('recentOrdersTbody') ? null : null);
  if (!order) return;

  document.getElementById('modalOrderTitle').textContent = `Order Details: #${order.order_number}`;

  const itemsHtml = (order.items || []).map(i => `
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.6rem 0; border-bottom: 1px solid var(--border-light);">
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <img src="${i.image_url}" alt="${i.product_name}" style="width: 40px; height: 40px; object-fit: contain; border-radius: var(--radius-sm); border: 1px solid var(--border);">
        <div>
          <div style="font-weight: 600; font-size: 0.9rem;">${i.product_name}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">${API.formatPrice(i.price)} &times; ${i.quantity}</div>
        </div>
      </div>
      <div style="font-weight: 700; font-size: 0.95rem;">${API.formatPrice(i.subtotal)}</div>
    </div>
  `).join('');

  document.getElementById('modalOrderBody').innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; background: var(--bg-subtle); padding: 1rem; border-radius: var(--radius-md);">
      <div>
        <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Customer Info</div>
        <div style="font-weight: 700; margin-top: 0.2rem;">${order.recipient_name}</div>
        <div style="font-size: 0.85rem; color: var(--text-muted);">${order.phone}</div>
        <div style="font-size: 0.85rem; color: var(--text-muted);">${order.customer_email || ''}</div>
      </div>
      <div>
        <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Delivery Address</div>
        <div style="font-size: 0.85rem; margin-top: 0.2rem;">${order.shipping_address}</div>
        <div style="font-size: 0.85rem;">${order.city}, ${order.state} ${order.postal_code}</div>
      </div>
    </div>

    <div style="margin-bottom: 1.5rem;">
      <div style="font-size: 0.85rem; font-weight: 800; text-transform: uppercase; color: #475569; margin-bottom: 0.5rem;">Purchased Items (${(order.items || []).length})</div>
      ${itemsHtml}
    </div>

    <div style="margin-top: 1rem; padding: 1rem; background: #f1f5f9; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem;">
      <div>
        <label style="font-size: 0.8rem; font-weight: 800; color: #334155; display: block; margin-bottom: 0.35rem;">
          <i class="fas fa-shipping-fast" style="color: #059669;"></i> Assign Delivery Agent:
        </label>
        <select onchange="assignDeliveryAgentToOrder(${order.id}, this.value)" class="form-control" style="width: 250px; font-size: 0.85rem; font-weight: 600;">
          <option value="">-- Unassigned --</option>
          ${allAdminStaff.filter(s => s.role === 'delivery_agent').map(a => `
            <option value="${a.id}" ${order.delivery_agent_id === a.id ? 'selected' : ''}>${a.name} (${a.phone || 'No phone'})</option>
          `).join('')}
        </select>
      </div>
      <div>
        <span style="font-size: 0.75rem; color: var(--text-muted);">Assigned agent will manage the physical delivery logistics.</span>
      </div>
    </div>
  `;

  document.getElementById('orderModal').classList.add('open');
}

async function assignDeliveryAgentToOrder(orderId, agentId) {
  try {
    await API.put(`/admin/orders/${orderId}/assign-delivery`, { delivery_agent_id: agentId ? parseInt(agentId) : null });
    showToast('Delivery agent assignment updated!', 'success');
    await loadAdminOrders();
    await loadAdminStaff();
  } catch (err) {
    showToast(err.message || 'Failed to assign delivery agent.', 'error');
  }
}

function closeOrderModal() {
  document.getElementById('orderModal').classList.remove('open');
}

// 6. Customers Directory (Load & Live Filter)
async function loadAdminCustomers() {
  try {
    const res = await API.get('/admin/customers');
    allAdminCustomers = res.customers || [];
    renderAdminCustomers(allAdminCustomers);
  } catch (err) {
    console.error('Failed to load admin customers:', err);
  }
}

function renderAdminCustomers(customers) {
  const tbody = document.getElementById('customersTbody');
  if (!tbody) return;

  if (customers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">No registered customers yet.</td></tr>';
    return;
  }

  tbody.innerHTML = customers.map(c => `
    <tr>
      <td>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="width: 36px; height: 36px; border-radius: 50%; background: #e0e7ff; color: #4338ca; display: flex; align-items: center; justify-content: center; font-weight: 700;">
            ${(c.name || 'C').charAt(0).toUpperCase()}
          </div>
          <div style="font-weight: 700;">${c.name}</div>
        </div>
      </td>
      <td style="font-size: 0.85rem; color: var(--text-muted);">${c.email}</td>
      <td style="font-size: 0.85rem;">${c.phone || '—'}</td>
      <td style="font-size: 0.85rem;">${c.city ? `${c.city}, ${c.state || ''}` : '—'}</td>
      <td><span style="font-weight: 700; background: #f1f5f9; padding: 0.2rem 0.6rem; border-radius: 999px;">${c.total_orders || 0} orders</span></td>
      <td style="font-weight: 700; color: #059669;">${API.formatPrice(c.total_spent || 0)}</td>
      <td style="color: var(--text-muted); font-size: 0.85rem;">${API.formatDate(c.created_at)}</td>
    </tr>
  `).join('');
}

function filterCustomersTable() {
  const query = (document.getElementById('customerSearchInput')?.value || '').toLowerCase().trim();
  const filtered = allAdminCustomers.filter(c => 
    c.name.toLowerCase().includes(query) || 
    c.email.toLowerCase().includes(query) ||
    (c.city && c.city.toLowerCase().includes(query)) ||
    (c.phone && c.phone.includes(query))
  );
  renderAdminCustomers(filtered);
}

// 7. View Payments (Transactions)
async function loadAdminPayments() {
  try {
    const res = await API.get('/admin/payments');
    if (res && res.payments) {
      allAdminPayments = res.payments;
      const summary = res.summary || {};
      
      document.getElementById('paymentSettledVal').textContent = API.formatPrice(summary.totalCollected || 0);
      document.getElementById('paymentPendingVal').textContent = API.formatPrice(summary.pendingCOD || 0);
      document.getElementById('paymentTransCount').textContent = summary.totalTransactions || 0;

      const tbody = document.getElementById('paymentsTbody');
      if (tbody) {
        if (allAdminPayments.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No payment transactions recorded.</td></tr>';
        } else {
          tbody.innerHTML = allAdminPayments.map(p => `
            <tr>
              <td style="font-family: monospace; font-weight: 700; color: var(--primary);">#${p.order_number}</td>
              <td>${p.recipient_name}</td>
              <td><span style="font-weight: 600;">${p.payment_method}</span></td>
              <td>
                <span style="font-size: 0.75rem; font-weight: 800; padding: 0.25rem 0.6rem; border-radius: 999px; background: ${p.payment_status === 'Paid' ? '#d1fae5' : '#fef3c7'}; color: ${p.payment_status === 'Paid' ? '#059669' : '#d97706'};">
                  ${p.payment_status}
                </span>
              </td>
              <td style="font-weight: 700;">${API.formatPrice(p.total_amount)}</td>
              <td style="color: var(--text-muted); font-size: 0.85rem;">${API.formatDate(p.created_at)}</td>
            </tr>
          `).join('');
        }
      }
    }
  } catch (err) {
    console.error('Failed to load admin payments:', err);
  }
}

// 8. Generate Reports
async function loadAdminReports() {
  try {
    const res = await API.get('/admin/reports');
    if (res && res.reports) {
      const rep = res.reports;

      // Category breakdown
      const catTbody = document.getElementById('reportCategoryTbody');
      if (catTbody) {
        if (!rep.categorySales || rep.categorySales.length === 0) {
          catTbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No sales data recorded yet.</td></tr>';
        } else {
          catTbody.innerHTML = rep.categorySales.map(cs => `
            <tr>
              <td style="font-weight: 700;">${cs.category_name || 'Uncategorized'}</td>
              <td>${cs.units_sold} units</td>
              <td style="font-weight: 700; color: #059669;">${API.formatPrice(cs.total_sales)}</td>
            </tr>
          `).join('');
        }
      }

      // Top Products
      const prodTbody = document.getElementById('reportProductsTbody');
      if (prodTbody) {
        if (!rep.topProducts || rep.topProducts.length === 0) {
          prodTbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No product sales recorded yet.</td></tr>';
        } else {
          prodTbody.innerHTML = rep.topProducts.map(tp => `
            <tr>
              <td style="font-weight: 600; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${tp.name}</td>
              <td>${tp.quantity_sold} sold</td>
              <td style="font-weight: 700; color: var(--primary);">${API.formatPrice(tp.revenue)}</td>
            </tr>
          `).join('');
        }
      }
    }
  } catch (err) {
    console.error('Failed to load admin reports:', err);
  }
}

// 9. Staff Management
async function loadAdminStaff() {
  try {
    const res = await API.get('/admin/staff');
    if (res && res.staff) {
      allAdminStaff = res.staff;

      // Stats
      const totalStaff = allAdminStaff.length;
      const adminsCount = allAdminStaff.filter(s => s.role === 'admin' || s.role === 'administrator').length;
      const agentsCount = allAdminStaff.filter(s => s.role === 'delivery_agent').length;

      document.getElementById('statTotalStaff').textContent = totalStaff;
      document.getElementById('statTotalAdmins').textContent = adminsCount;
      document.getElementById('statTotalAgents').textContent = agentsCount;

      renderStaffTable(allAdminStaff);
    }
  } catch (err) {
    console.error('Failed to load admin staff:', err);
  }
}

function renderStaffTable(staffList) {
  const tbody = document.getElementById('staffTbody');
  if (!tbody) return;

  if (staffList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No staff members found.</td></tr>';
    return;
  }

  const currentUser = API.getUser() || {};

  tbody.innerHTML = staffList.map(s => {
    const isCurrentUser = s.id === currentUser.id;
    const isDeliveryAgent = s.role === 'delivery_agent';
    const roleBadge = isDeliveryAgent
      ? `<span style="font-size: 0.75rem; font-weight: 800; padding: 0.25rem 0.65rem; border-radius: 999px; background: #d1fae5; color: #065f46;"><i class="fas fa-truck"></i> Delivery Agent</span>`
      : `<span style="font-size: 0.75rem; font-weight: 800; padding: 0.25rem 0.65rem; border-radius: 999px; background: #ede9fe; color: #6d28d9;"><i class="fas fa-crown"></i> Admin</span>`;

    return `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div style="width: 38px; height: 38px; border-radius: 50%; background: ${isDeliveryAgent ? '#059669' : '#4f46e5'}; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700;">
              ${(s.name || 'S').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style="font-weight: 700; color: #0f172a;">${s.name} ${isCurrentUser ? '<span style="font-size: 0.65rem; background: #e0e7ff; color: #4338ca; padding: 1px 5px; border-radius: 4px;">YOU</span>' : ''}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${s.email}</div>
            </div>
          </div>
        </td>
        <td>${roleBadge}</td>
        <td style="font-size: 0.85rem;">${s.phone || '—'}</td>
        <td style="font-size: 0.85rem;">${s.city || '—'}</td>
        <td>
          <span style="font-weight: 700; font-size: 0.85rem; color: #475569;">
            ${s.assigned_deliveries || 0} deliveries
          </span>
        </td>
        <td>
          <div style="display: flex; gap: 0.4rem;">
            <button onclick="editStaff(${s.id})" class="btn btn-secondary btn-sm" title="Edit Staff" style="padding: 0.3rem 0.55rem;">
              <i class="fas fa-edit"></i>
            </button>
            ${!isCurrentUser ? `
              <button onclick="deleteStaff(${s.id}, '${s.name.replace(/'/g, "\\'")}')" class="btn btn-danger btn-sm" title="Remove Staff" style="padding: 0.3rem 0.55rem; background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5;">
                <i class="fas fa-trash-alt"></i>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function filterStaffTable() {
  const query = (document.getElementById('staffSearchInput')?.value || '').toLowerCase().trim();
  const roleFilter = document.getElementById('staffRoleFilter')?.value || 'all';

  const filtered = allAdminStaff.filter(s => {
    const matchesQuery = s.name.toLowerCase().includes(query) || s.email.toLowerCase().includes(query) || (s.phone && s.phone.includes(query));
    const matchesRole = roleFilter === 'all' || s.role === roleFilter;
    return matchesQuery && matchesRole;
  });

  renderStaffTable(filtered);
}

async function handleStaffSubmit(e) {
  e.preventDefault();
  const editId = document.getElementById('editStaffId').value;
  const isEditing = !!editId;

  const staffData = {
    name: document.getElementById('staffName').value.trim(),
    email: document.getElementById('staffEmail').value.trim(),
    role: document.getElementById('staffRole').value,
    phone: document.getElementById('staffPhone').value.trim(),
    city: document.getElementById('staffCity').value.trim()
  };

  const passwordVal = document.getElementById('staffPassword').value;
  if (passwordVal) {
    staffData.password = passwordVal;
  }

  const saveBtn = document.getElementById('saveStaffBtn');
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Saving...';

  try {
    if (isEditing) {
      await API.put(`/admin/staff/${editId}`, staffData);
      showToast('Staff member details updated!', 'success');
    } else {
      await API.post('/admin/staff', staffData);
      showToast(`New ${staffData.role.replace('_', ' ')} added to staff!`, 'success');
    }

    resetStaffForm();
    await loadAdminStaff();
  } catch (err) {
    showToast(err.message || 'Failed to save staff member.', 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Staff';
  }
}

function editStaff(staffId) {
  const staff = allAdminStaff.find(s => s.id === staffId);
  if (!staff) return;

  document.getElementById('editStaffId').value = staff.id;
  document.getElementById('staffName').value = staff.name || '';
  document.getElementById('staffEmail').value = staff.email || '';
  document.getElementById('staffRole').value = staff.role || 'delivery_agent';
  document.getElementById('staffPhone').value = staff.phone || '';
  document.getElementById('staffCity').value = staff.city || '';

  // Password optional when editing
  document.getElementById('staffPassword').required = false;
  document.getElementById('staffPassword').placeholder = 'Leave blank to keep current password';

  document.getElementById('staffFormTitle').innerHTML = `<i class="fas fa-user-edit" style="color: var(--primary);"></i> Edit Staff: ${staff.name}`;
  document.getElementById('saveStaffBtn').innerHTML = '<i class="fas fa-check"></i> Update Staff';
}

function resetStaffForm() {
  document.getElementById('addStaffForm').reset();
  document.getElementById('editStaffId').value = '';
  document.getElementById('staffPassword').required = true;
  document.getElementById('staffPassword').placeholder = 'Min 6 characters';
  document.getElementById('staffFormTitle').innerHTML = '<i class="fas fa-user-plus" style="color: var(--primary);"></i> Add New Staff Member';
  document.getElementById('saveStaffBtn').innerHTML = '<i class="fas fa-save"></i> Save Staff';
}

async function deleteStaff(staffId, name) {
  if (!confirm(`Are you sure you want to remove staff member "${name}"?`)) return;

  try {
    await API.delete(`/admin/staff/${staffId}`);
    showToast(`Staff member removed successfully.`, 'success');
    await loadAdminStaff();
  } catch (err) {
    showToast(err.message || 'Failed to remove staff member.', 'error');
  }
}

// Sidebar toggle for mobile
function toggleAdminSidebar() {
  document.getElementById('adminSidebar')?.classList.toggle('mobile-open');
}

// Logout
function handleAdminLogout() {
  API.logout();
}

