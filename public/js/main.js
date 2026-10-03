// Main Storefront Logic
let currentCategory = 'all';
let currentSearch = '';
let currentSort = 'newest';

document.addEventListener('DOMContentLoaded', async () => {
  // Parse query parameters from URL
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('category')) {
    currentCategory = urlParams.get('category');
  }
  if (urlParams.has('search')) {
    currentSearch = urlParams.get('search');
    const searchInput = document.getElementById('navbarSearchInput');
    if (searchInput) searchInput.value = currentSearch;
  }

  await loadCategories();
  await loadProducts();
});

// Load Categories
async function loadCategories() {
  try {
    const res = await API.get('/products/categories');
    const bar = document.getElementById('categories-bar');
    if (!bar || !res.categories) return;

    res.categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = `cat-pill ${currentCategory === cat.slug ? 'active' : ''}`;
      btn.innerHTML = `<i class="${cat.icon || 'fas fa-box'}"></i> ${cat.name}`;
      btn.onclick = () => selectCategory(cat.slug, btn);
      bar.appendChild(btn);
    });
  } catch (err) {
    console.error('Failed to load categories:', err);
  }
}

// Category Selection Handler
function selectCategory(slug, btnElement) {
  currentCategory = slug;

  // Update button active state
  document.querySelectorAll('.cat-pill').forEach(el => el.classList.remove('active'));
  if (btnElement) {
    btnElement.classList.add('active');
  }

  loadProducts();
}

// Sort Handler
function handleSortChange(sortValue) {
  currentSort = sortValue;
  loadProducts();
}

// Search Filter Handler called from navbar
window.filterProductsBySearch = function(query) {
  currentSearch = query;
  loadProducts();
};

// Load Products from API
async function loadProducts() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  grid.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 0;">
      <i class="fas fa-circle-notch fa-spin" style="font-size: 2.5rem; color: var(--primary);"></i>
      <p style="margin-top: 1rem; color: var(--text-muted); font-weight: 600;">Loading fresh products...</p>
    </div>
  `;

  try {
    let endpoint = `/products?sort=${currentSort}`;
    if (currentCategory && currentCategory !== 'all') {
      endpoint += `&category=${encodeURIComponent(currentCategory)}`;
    }
    if (currentSearch && currentSearch.trim() !== '') {
      endpoint += `&search=${encodeURIComponent(currentSearch)}`;
    }

    const res = await API.get(endpoint);
    const products = res.products || [];

    // Update Section Title
    const titleEl = document.getElementById('catalog-title');
    const subtitleEl = document.getElementById('catalog-subtitle');
    if (titleEl && subtitleEl) {
      if (currentSearch) {
        titleEl.textContent = `Search Results for "${currentSearch}"`;
        subtitleEl.textContent = `Found ${products.length} matching products`;
      } else if (currentCategory !== 'all') {
        titleEl.textContent = `${currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1)} Products`;
        subtitleEl.textContent = `Showing ${products.length} products in this category`;
      } else {
        titleEl.textContent = 'Featured Catalog';
        subtitleEl.textContent = `Showing all ${products.length} available items`;
      }
    }

    if (products.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 5rem 1rem; background: var(--bg-card); border-radius: var(--radius-xl); border: 1px dashed var(--border);">
          <i class="fas fa-box-open" style="font-size: 3.5rem; color: var(--text-light); margin-bottom: 1.25rem;"></i>
          <h3 style="margin-bottom: 0.5rem;">No products found</h3>
          <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Try adjusting your search or category filters to find what you're looking for.</p>
          <button class="btn btn-primary" onclick="resetFilters()">
            <i class="fas fa-undo"></i> Reset Filters
          </button>
        </div>
      `;
      return;
    }

    grid.innerHTML = products.map(product => renderProductCard(product)).join('');
  } catch (err) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 0; color: var(--danger);">
        <i class="fas fa-exclamation-triangle" style="font-size: 2.5rem; margin-bottom: 1rem;"></i>
        <p>Failed to load products. Please check server connection.</p>
      </div>
    `;
  }
}

// Reset Filters
function resetFilters() {
  currentCategory = 'all';
  currentSearch = '';
  const searchInput = document.getElementById('navbarSearchInput');
  if (searchInput) searchInput.value = '';
  document.querySelectorAll('.cat-pill').forEach((el, index) => {
    if (index === 0) el.classList.add('active');
    else el.classList.remove('active');
  });
  loadProducts();
}

// Render Single Product Card HTML
function renderProductCard(product) {
  const isOutOfStock = product.stock <= 0;
  const hasDiscount = product.original_price && Number(product.original_price) > Number(product.price);
  const discountPercent = hasDiscount ? Math.round(((product.original_price - product.price) / product.original_price) * 100) : 0;

  return `
    <div class="product-card">
      <div class="product-thumb-wrap">
        <div class="product-badge-group">
          ${product.is_featured ? `<span class="badge badge-featured"><i class="fas fa-star"></i> Featured</span>` : ''}
          ${hasDiscount ? `<span class="badge badge-discount">-${discountPercent}% OFF</span>` : ''}
          ${isOutOfStock ? `<span class="badge badge-stock-out">Out of Stock</span>` : ''}
        </div>
        <a href="/product.html?id=${product.id}">
          <img src="${product.image_url}" alt="${escapeHtml(product.name)}" class="product-thumb" loading="lazy">
        </a>
      </div>

      <div class="product-body">
        <div class="product-category">${product.category_name || 'Electronics'}</div>
        <a href="/product.html?id=${product.id}">
          <h3 class="product-title" title="${escapeHtml(product.name)}">${escapeHtml(product.name)}</h3>
        </a>

        <div class="product-rating">
          <i class="fas fa-star"></i>
          <span style="font-weight: 700; color: var(--text-main);">${Number(product.rating).toFixed(1)}</span>
          <span>(${product.num_reviews || 0} reviews)</span>
        </div>

        <div class="product-footer">
          <div class="product-price-wrap">
            <span class="product-price">${API.formatPrice(product.price)}</span>
            ${hasDiscount ? `<span class="product-old-price">${API.formatPrice(product.original_price)}</span>` : ''}
          </div>

          <button 
            class="btn-add-cart" 
            onclick="quickAddToCart(${product.id}, event)" 
            title="${isOutOfStock ? 'Out of Stock' : 'Add to Cart'}"
            ${isOutOfStock ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}
          >
            <i class="fas fa-cart-plus"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

// Quick Add to Cart Handler
async function quickAddToCart(productId, event) {
  if (event) event.stopPropagation();

  if (!API.isLoggedIn()) {
    showToast('Please sign in to add products to your cart.', 'warning');
    setTimeout(() => {
      window.location.href = `/login.html?redirect=/product.html?id=${productId}`;
    }, 1200);
    return;
  }

  try {
    const res = await API.post('/cart', { productId, quantity: 1 });
    showToast(res.message || 'Added to cart!', 'success');
    API.updateCartBadge();
  } catch (err) {
    showToast(err.message || 'Failed to add item to cart.', 'error');
  }
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
