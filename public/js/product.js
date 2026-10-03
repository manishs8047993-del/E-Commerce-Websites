// Product Detail Page Logic
let currentProduct = null;
let currentQuantity = 1;

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  if (!productId) {
    window.location.href = '/index.html';
    return;
  }

  await loadProductDetails(productId);
});

async function loadProductDetails(id) {
  const root = document.getElementById('product-detail-root');
  try {
    const res = await API.get(`/products/${id}`);
    const product = res.product;
    const reviews = res.reviews || [];
    const related = res.relatedProducts || [];
    currentProduct = product;

    // Update Page Titles and Breadcrumbs
    document.title = `${product.name} — NovaStore`;
    const catBreadcrumb = document.getElementById('breadcrumb-category');
    const titleBreadcrumb = document.getElementById('breadcrumb-title');
    if (catBreadcrumb) catBreadcrumb.textContent = product.category_name || 'Category';
    if (titleBreadcrumb) titleBreadcrumb.textContent = product.name;

    // Stock Status Calculation
    let stockClass = 'in-stock';
    let stockText = `In Stock (${product.stock} units left)`;
    if (product.stock <= 0) {
      stockClass = 'out-of-stock';
      stockText = 'Currently Out of Stock';
    } else if (product.stock <= 5) {
      stockClass = 'low-stock';
      stockText = `Low Stock — Only ${product.stock} remaining!`;
    }

    const hasDiscount = product.original_price && Number(product.original_price) > Number(product.price);
    const discountPercent = hasDiscount ? Math.round(((product.original_price - product.price) / product.original_price) * 100) : 0;

    root.innerHTML = `
      <div class="product-detail-grid">
        <!-- Gallery -->
        <div class="product-gallery">
          <div class="gallery-main">
            <img src="${product.image_url}" alt="${escapeHtml(product.name)}" id="main-prod-img">
          </div>
        </div>

        <!-- Details Info -->
        <div class="detail-info">
          <div class="detail-brand">${product.brand || 'Nova Signature'} • ${product.category_name || 'General'}</div>
          <h1 class="detail-title">${escapeHtml(product.name)}</h1>

          <div class="detail-rating">
            <div style="color: #f59e0b; display: flex; gap: 3px; font-size: 1rem;">
              ${renderStarRating(product.rating)}
            </div>
            <span style="font-weight: 700; font-size: 0.95rem;">${Number(product.rating).toFixed(1)} / 5.0</span>
            <span style="color: var(--text-muted); font-size: 0.9rem;">(${reviews.length} customer reviews)</span>
          </div>

          <div class="detail-price-box">
            <span class="detail-price">${API.formatPrice(product.price)}</span>
            ${hasDiscount ? `
              <span class="detail-old-price">${API.formatPrice(product.original_price)}</span>
              <span class="badge badge-discount" style="font-size: 0.85rem; padding: 0.35rem 0.75rem;">Save ${discountPercent}%</span>
            ` : ''}
          </div>

          <div class="stock-indicator ${stockClass}">
            <span class="stock-dot"></span>
            <span>${stockText}</span>
          </div>

          <p class="detail-desc">${escapeHtml(product.description)}</p>

          <!-- Action Controls -->
          <div class="detail-actions">
            <div class="quantity-picker">
              <button class="qty-btn" onclick="adjustQty(-1)" ${product.stock <= 0 ? 'disabled' : ''}>-</button>
              <input type="number" id="qty-input" class="qty-input" value="1" min="1" max="${product.stock}" readonly>
              <button class="qty-btn" onclick="adjustQty(1)" ${product.stock <= 0 ? 'disabled' : ''}>+</button>
            </div>

            <button 
              class="btn btn-primary btn-lg" 
              onclick="handleAddToCart()" 
              style="flex: 1;"
              ${product.stock <= 0 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}
            >
              <i class="fas fa-cart-plus"></i> Add to Cart
            </button>

            <button 
              class="btn btn-secondary btn-lg" 
              onclick="handleBuyNow()" 
              style="background: var(--dark-bg); color: white; border-color: var(--dark-bg);"
              ${product.stock <= 0 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}
            >
              <i class="fas fa-bolt"></i> Buy Now
            </button>
          </div>

          <!-- Feature Badges -->
          <div class="detail-features">
            <div class="feature-item">
              <i class="fas fa-truck-fast"></i>
              <span>Free Delivery on orders above $100</span>
            </div>
            <div class="feature-item">
              <i class="fas fa-money-bill-wave"></i>
              <span>Cash on Delivery (COD) Available</span>
            </div>
            <div class="feature-item">
              <i class="fas fa-shield-check"></i>
              <span>100% Genuine Certified Product</span>
            </div>
            <div class="feature-item">
              <i class="fas fa-rotate-left"></i>
              <span>30-Day Hassle-Free Return Policy</span>
            </div>
          </div>
        </div>
      </div>
    `;

    renderReviewsSection(reviews, product.id);
    renderRelatedSection(related);
  } catch (err) {
    root.innerHTML = `
      <div style="text-align: center; padding: 4rem 1rem; color: var(--danger);">
        <i class="fas fa-exclamation-circle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
        <h2>Product Not Found</h2>
        <p style="color: var(--text-muted); margin-bottom: 1.5rem;">The product you requested could not be retrieved or has been removed.</p>
        <a href="/index.html" class="btn btn-primary"><i class="fas fa-arrow-left"></i> Back to Store</a>
      </div>
    `;
  }
}

function adjustQty(change) {
  if (!currentProduct) return;
  const input = document.getElementById('qty-input');
  let val = parseInt(input.value) + change;
  if (val < 1) val = 1;
  if (val > currentProduct.stock) val = currentProduct.stock;
  input.value = val;
  currentQuantity = val;
}

async function handleAddToCart() {
  if (!API.isLoggedIn()) {
    showToast('Please sign in to add products to your cart.', 'warning');
    setTimeout(() => {
      window.location.href = `/login.html?redirect=/product.html?id=${currentProduct.id}`;
    }, 1200);
    return;
  }

  try {
    const res = await API.post('/cart', {
      productId: currentProduct.id,
      quantity: currentQuantity
    });
    showToast(res.message || 'Item added to your cart!', 'success');
    API.updateCartBadge();
  } catch (err) {
    showToast(err.message || 'Failed to add item.', 'error');
  }
}

function handleBuyNow() {
  if (!API.isLoggedIn()) {
    showToast('Please sign in to proceed with direct checkout.', 'warning');
    setTimeout(() => {
      window.location.href = `/login.html?redirect=/checkout.html?buyNowProductId=${currentProduct.id}&qty=${currentQuantity}`;
    }, 1200);
    return;
  }

  window.location.href = `/checkout.html?buyNowProductId=${currentProduct.id}&qty=${currentQuantity}`;
}

function renderReviewsSection(reviews, productId) {
  const section = document.getElementById('reviews-section');
  if (!section) return;

  const isLoggedIn = API.isLoggedIn();

  section.innerHTML = `
    <div style="background: var(--bg-card); border-radius: var(--radius-xl); border: 1px solid var(--border); padding: 2.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h2 style="font-size: 1.5rem; margin-bottom: 0.25rem;">Verified Customer Reviews</h2>
          <p style="color: var(--text-muted); font-size: 0.9rem;">Real feedback from verified purchasers</p>
        </div>
      </div>

      <!-- Add Review Form -->
      <div style="background: var(--bg-subtle); border-radius: var(--radius-lg); padding: 1.5rem; margin-bottom: 2.5rem; border: 1px solid var(--border);">
        <h4 style="margin-bottom: 1rem;">Write a Review</h4>
        ${isLoggedIn ? `
          <form id="reviewForm" onsubmit="submitReview(event, ${productId})">
            <div class="form-group">
              <label class="form-label">Your Rating</label>
              <select id="reviewRating" class="form-control" style="max-width: 200px;">
                <option value="5">⭐⭐⭐⭐⭐ 5 - Outstanding</option>
                <option value="4">⭐⭐⭐⭐ 4 - Very Good</option>
                <option value="3">⭐⭐⭐ 3 - Average</option>
                <option value="2">⭐⭐ 2 - Below Expectations</option>
                <option value="1">⭐ 1 - Poor</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Your Feedback / Review</label>
              <textarea id="reviewComment" class="form-control" rows="3" placeholder="Share details of your experience with this product..." required></textarea>
            </div>
            <button type="submit" class="btn btn-primary btn-sm">
              <i class="fas fa-paper-plane"></i> Submit Review
            </button>
          </form>
        ` : `
          <p style="color: var(--text-muted); font-size: 0.95rem;">
            Please <a href="/login.html?redirect=/product.html?id=${productId}" style="color: var(--primary); font-weight: 700;">Sign in</a> to leave a product review.
          </p>
        `}
      </div>

      <!-- Reviews List -->
      <div style="display: flex; flex-direction: column; gap: 1.25rem;">
        ${reviews.length === 0 ? `
          <p style="color: var(--text-muted); text-align: center; padding: 2rem 0;">No reviews yet. Be the first to review this product!</p>
        ` : reviews.map(r => `
          <div style="padding-bottom: 1.25rem; border-bottom: 1px solid var(--border-light);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <div style="display: flex; align-items: center; gap: 0.6rem;">
                <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem;">
                  ${r.user_name ? r.user_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <div style="font-weight: 700; font-size: 0.95rem;">${escapeHtml(r.user_name || 'Customer')}</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">${API.formatDate(r.created_at)}</div>
                </div>
              </div>
              <div style="color: #f59e0b; font-size: 0.85rem;">
                ${renderStarRating(r.rating)}
              </div>
            </div>
            <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.5;">${escapeHtml(r.comment)}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

async function submitReview(e, productId) {
  e.preventDefault();
  const rating = document.getElementById('reviewRating').value;
  const comment = document.getElementById('reviewComment').value.trim();

  if (!comment) {
    showToast('Please enter your review text.', 'warning');
    return;
  }

  try {
    const res = await API.post(`/products/${productId}/reviews`, { rating, comment });
    showToast(res.message || 'Review submitted successfully!', 'success');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  } catch (err) {
    showToast(err.message || 'Failed to submit review.', 'error');
  }
}

function renderRelatedSection(relatedProducts) {
  const section = document.getElementById('related-section');
  if (!section || relatedProducts.length === 0) return;

  section.innerHTML = `
    <div style="margin-top: 2rem;">
      <h2 style="font-size: 1.5rem; margin-bottom: 1.5rem;">You Might Also Like</h2>
      <div class="products-grid">
        ${relatedProducts.map(p => `
          <div class="product-card">
            <div class="product-thumb-wrap">
              <a href="/product.html?id=${p.id}">
                <img src="${p.image_url}" alt="${escapeHtml(p.name)}" class="product-thumb">
              </a>
            </div>
            <div class="product-body">
              <div class="product-category">${p.category_name || 'Electronics'}</div>
              <a href="/product.html?id=${p.id}">
                <h3 class="product-title">${escapeHtml(p.name)}</h3>
              </a>
              <div class="product-footer">
                <span class="product-price">${API.formatPrice(p.price)}</span>
                <a href="/product.html?id=${p.id}" class="btn btn-outline btn-sm">View</a>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderStarRating(rating) {
  const r = Math.round(Number(rating) || 5);
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    stars += `<i class="${i <= r ? 'fas' : 'far'} fa-star"></i>`;
  }
  return stars;
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
