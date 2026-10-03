// Shopping Cart Management Logic
let discountPercent = 0;
let appliedPromoCode = '';

document.addEventListener('DOMContentLoaded', async () => {
  if (!API.isLoggedIn()) {
    showEmptyOrUnauth(false);
    return;
  }
  await loadCart();
});

async function loadCart() {
  const root = document.getElementById('cart-root');

  // Show loading state
  if (root) {
    root.innerHTML = `
      <div style="text-align: center; padding: 4rem 2rem;">
        <i class="fas fa-spinner fa-spin" style="font-size: 2.5rem; color: var(--primary); margin-bottom: 1rem;"></i>
        <p style="color: var(--text-muted);">Loading your cart...</p>
      </div>
    `;
  }

  try {
    const res = await API.get('/cart');
    const items = res.items || [];
    const summary = res.summary || {};

    if (items.length === 0) {
      showEmptyOrUnauth(true);
      return;
    }

    // Calculate with promo discount if any
    const discountAmount = discountPercent > 0 ? (summary.subtotal * (discountPercent / 100)) : 0;
    const finalTotal = Math.max(0, summary.subtotal - discountAmount + summary.shippingFee + summary.estimatedTax);

    root.innerHTML = `
      <div class="cart-layout">
        <!-- Cart Items List -->
        <div class="cart-items-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h3 style="font-size: 1.25rem;">Items in Cart (${summary.totalItems})</h3>
            <button onclick="handleClearCart()" class="btn btn-outline btn-sm" style="color: var(--danger); border-color: var(--danger);">
              <i class="fas fa-trash-alt"></i> Clear All
            </button>
          </div>

          <div class="cart-table-header">
            <span>Product</span>
            <span>Price</span>
            <span>Quantity</span>
            <span>Total</span>
            <span></span>
          </div>

          <div style="display: flex; flex-direction: column;">
            ${items.map(item => `
              <div class="cart-item-row" id="cart-item-${item.cart_item_id}">
                <div class="cart-item-info">
                  <a href="/product.html?id=${item.product_id}">
                    <img src="${item.image_url}" alt="${escapeHtml(item.name)}" class="cart-item-img">
                  </a>
                  <div>
                    <a href="/product.html?id=${item.product_id}">
                      <div class="cart-item-name">${escapeHtml(item.name)}</div>
                    </a>
                    <div class="cart-item-cat">${item.stock > 0 ? `<span style="color: var(--success); font-weight: 600;"><i class="fas fa-check"></i> In Stock</span>` : `<span style="color: var(--danger);">Out of Stock</span>`}</div>
                  </div>
                </div>

                <div style="font-weight: 700; color: var(--text-main);">
                  ${API.formatPrice(item.price)}
                </div>

                <div>
                  <div class="quantity-picker" style="max-width: 120px;">
                    <button class="qty-btn" style="height: 38px; width: 34px;" onclick="updateCartQty(${item.cart_item_id}, ${item.quantity - 1})">-</button>
                    <span class="qty-input" style="height: 38px; width: 38px; display: flex; align-items: center; justify-content: center; font-size: 0.95rem;">${item.quantity}</span>
                    <button class="qty-btn" style="height: 38px; width: 34px;" onclick="updateCartQty(${item.cart_item_id}, ${item.quantity + 1})" ${item.quantity >= item.stock ? 'disabled' : ''}>+</button>
                  </div>
                </div>

                <div style="font-weight: 800; font-family: 'Outfit', sans-serif; color: var(--primary);">
                  ${API.formatPrice(item.price * item.quantity)}
                </div>

                <div>
                  <button class="cart-item-remove" onclick="removeCartItem(${item.cart_item_id})" title="Remove item">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>

          <div style="margin-top: 1.5rem;">
            <a href="/index.html" class="btn btn-secondary btn-sm">
              <i class="fas fa-arrow-left"></i> Continue Shopping
            </a>
          </div>
        </div>

        <!-- Order Summary & Checkout -->
        <div>
          <div class="order-summary-card">
            <h3 style="font-size: 1.25rem; margin-bottom: 1.5rem;">Order Summary</h3>

            <div class="summary-line">
              <span>Subtotal (${summary.totalItems} items)</span>
              <span>${API.formatPrice(summary.subtotal)}</span>
            </div>

            ${discountPercent > 0 ? `
              <div class="summary-line" style="color: var(--success); font-weight: 700;">
                <span>Discount (${appliedPromoCode} - ${discountPercent}%)</span>
                <span>-${API.formatPrice(discountAmount)}</span>
              </div>
            ` : ''}

            <div class="summary-line">
              <span>Estimated Shipping</span>
              <span>${summary.shippingFee === 0 ? '<span style="color: var(--success); font-weight: 700;">FREE</span>' : API.formatPrice(summary.shippingFee)}</span>
            </div>

            <div class="summary-line">
              <span>Estimated Tax (5%)</span>
              <span>${API.formatPrice(summary.estimatedTax)}</span>
            </div>

            <div class="summary-line total">
              <span>Estimated Total</span>
              <span style="color: var(--primary);">${API.formatPrice(finalTotal)}</span>
            </div>

            <!-- Promo Code Form -->
            <div style="margin: 1.5rem 0;">
              <div style="display: flex; gap: 0.5rem;">
                <input type="text" id="promoInput" class="form-control" placeholder="Promo code (e.g. SAVE10)" value="${appliedPromoCode}">
                <button class="btn btn-secondary" onclick="applyPromoCode()">Apply</button>
              </div>
              <small style="color: var(--text-muted); font-size: 0.75rem; margin-top: 0.35rem; display: block;">Try code <b>SAVE10</b> for 10% discount!</small>
            </div>

            <button onclick="proceedToCheckout()" class="btn btn-primary btn-block btn-lg" style="margin-top: 1rem;">
              <i class="fas fa-shield-alt"></i> Proceed to Checkout
            </button>

            <div style="margin-top: 1.5rem; text-align: center; font-size: 0.8rem; color: var(--text-muted);">
              <i class="fas fa-lock" style="color: var(--success);"></i> Safe & Encrypted Checkout with Cash on Delivery
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    console.error('Cart load error:', err);
    // If token was wiped due to 401, show the login screen
    if (!API.isLoggedIn()) {
      showEmptyOrUnauth(false);
      return;
    }
    // Otherwise show a proper error message, not a misleading empty cart
    if (root) {
      root.innerHTML = `
        <div style="background: var(--bg-card); border-radius: var(--radius-xl); border: 1px solid var(--danger); padding: 3rem 2rem; text-align: center; max-width: 600px; margin: 2rem auto;">
          <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--danger); margin-bottom: 1.25rem;"></i>
          <h2 style="margin-bottom: 0.75rem;">Couldn't Load Your Cart</h2>
          <p style="color: var(--text-muted); margin-bottom: 2rem;">${err.message || 'A server error occurred. Please try again.'}</p>
          <div style="display: flex; gap: 1rem; justify-content: center;">
            <button onclick="loadCart()" class="btn btn-primary btn-lg">
              <i class="fas fa-redo"></i> Retry
            </button>
            <a href="/index.html" class="btn btn-secondary btn-lg">
              <i class="fas fa-arrow-left"></i> Browse Store
            </a>
          </div>
        </div>
      `;
    }
  }
}

async function updateCartQty(cartItemId, newQty) {
  if (newQty <= 0) {
    return removeCartItem(cartItemId);
  }

  try {
    await API.put(`/cart/${cartItemId}`, { quantity: newQty });
    await loadCart();
    API.updateCartBadge();
  } catch (err) {
    showToast(err.message || 'Failed to update quantity', 'error');
  }
}

async function removeCartItem(cartItemId) {
  try {
    await API.delete(`/cart/${cartItemId}`);
    showToast('Item removed from cart.', 'info');
    await loadCart();
    API.updateCartBadge();
  } catch (err) {
    showToast(err.message || 'Failed to remove item', 'error');
  }
}

async function handleClearCart() {
  if (!confirm('Are you sure you want to clear your entire cart?')) return;

  try {
    await API.delete('/cart');
    showToast('Shopping cart cleared.', 'info');
    await loadCart();
    API.updateCartBadge();
  } catch (err) {
    showToast('Failed to clear cart', 'error');
  }
}

function applyPromoCode() {
  const code = document.getElementById('promoInput').value.trim().toUpperCase();
  if (code === 'SAVE10') {
    discountPercent = 10;
    appliedPromoCode = code;
    showToast('Promo code applied: 10% OFF discount!', 'success');
    loadCart();
  } else if (code === 'WELCOME20') {
    discountPercent = 20;
    appliedPromoCode = code;
    showToast('Promo code applied: 20% OFF discount!', 'success');
    loadCart();
  } else {
    showToast('Invalid promo code. Try "SAVE10" or "WELCOME20"', 'warning');
  }
}

function proceedToCheckout() {
  window.location.href = '/checkout.html';
}

function showEmptyOrUnauth(isLoggedIn) {
  const root = document.getElementById('cart-root');
  if (!root) return;

  if (!isLoggedIn) {
    root.innerHTML = `
      <div style="background: var(--bg-card); border-radius: var(--radius-xl); border: 1px solid var(--border); padding: 4rem 2rem; text-align: center; max-width: 600px; margin: 2rem auto;">
        <i class="fas fa-user-lock" style="font-size: 3.5rem; color: var(--primary); margin-bottom: 1.25rem;"></i>
        <h2 style="margin-bottom: 0.75rem;">Please Sign In to Access Your Cart</h2>
        <p style="color: var(--text-muted); margin-bottom: 2rem;">Log in or create a free account to view items you've added and place orders.</p>
        <div style="display: flex; gap: 1rem; justify-content: center;">
          <a href="/login.html?redirect=/cart.html" class="btn btn-primary btn-lg">
            <i class="fas fa-sign-in-alt"></i> Sign In / Register
          </a>
          <a href="/index.html" class="btn btn-secondary btn-lg">
            <i class="fas fa-arrow-left"></i> Browse Store
          </a>
        </div>
      </div>
    `;
  } else {
    root.innerHTML = `
      <div style="background: var(--bg-card); border-radius: var(--radius-xl); border: 1px dashed var(--border); padding: 4rem 2rem; text-align: center; max-width: 600px; margin: 2rem auto;">
        <i class="fas fa-shopping-cart" style="font-size: 3.5rem; color: var(--text-light); margin-bottom: 1.25rem;"></i>
        <h2 style="margin-bottom: 0.75rem;">Your Cart is Empty</h2>
        <p style="color: var(--text-muted); margin-bottom: 2rem;">Looks like you haven't added anything to your cart yet. Discover high quality products in our catalog!</p>
        <a href="/index.html" class="btn btn-primary btn-lg">
          <i class="fas fa-shopping-bag"></i> Start Shopping
        </a>
      </div>
    `;
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
