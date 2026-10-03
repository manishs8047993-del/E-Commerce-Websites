// Checkout & Payment Logic
let checkoutItems = [];
let checkoutSummary = {};
let isDirectBuy = false;
let directBuyProduct = null;
let selectedPaymentMethod = 'Cash on Delivery';

document.addEventListener('DOMContentLoaded', async () => {
  if (!API.isLoggedIn()) {
    showToast('Please sign in to proceed with checkout.', 'warning');
    setTimeout(() => {
      window.location.href = `/login.html?redirect=/checkout.html`;
    }, 1200);
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const buyNowId = urlParams.get('buyNowProductId');
  const buyNowQty = parseInt(urlParams.get('qty')) || 1;

  if (buyNowId) {
    isDirectBuy = true;
    await loadDirectBuyProduct(buyNowId, buyNowQty);
  } else {
    await loadCartForCheckout();
  }
});

async function loadDirectBuyProduct(productId, qty) {
  try {
    const res = await API.get(`/products/${productId}`);
    const product = res.product;
    directBuyProduct = { ...product, quantity: qty };

    const subtotal = product.price * qty;
    const shippingFee = subtotal > 100 ? 0 : 9.99;
    const estimatedTax = subtotal * 0.05;
    const total = subtotal + shippingFee + estimatedTax;

    checkoutItems = [{
      product_id: product.id,
      name: product.name,
      price: product.price,
      quantity: qty,
      image_url: product.image_url,
      item_subtotal: subtotal
    }];

    checkoutSummary = {
      totalItems: qty,
      subtotal,
      shippingFee,
      estimatedTax,
      total
    };

    renderCheckoutUI();
  } catch (err) {
    showToast('Failed to load item for checkout.', 'error');
    setTimeout(() => { window.location.href = '/index.html'; }, 1500);
  }
}

async function loadCartForCheckout() {
  try {
    const res = await API.get('/cart');
    checkoutItems = res.items || [];
    checkoutSummary = res.summary || {};

    if (checkoutItems.length === 0) {
      showToast('Your shopping cart is empty.', 'warning');
      setTimeout(() => { window.location.href = '/index.html'; }, 1500);
      return;
    }

    renderCheckoutUI();
  } catch (err) {
    showToast('Failed to load checkout details.', 'error');
  }
}

function renderCheckoutUI() {
  const root = document.getElementById('checkout-root');
  if (!root) return;

  const user = API.getUser() || {};

  root.innerHTML = `
    <div class="cart-layout">
      <!-- User Shipping Details Form -->
      <div class="cart-items-card">
        <h2 style="font-size: 1.4rem; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.6rem;">
          <i class="fas fa-map-marker-alt" style="color: var(--primary);"></i>
          <span>1. Shipping & Contact Details</span>
        </h2>

        <form id="checkoutForm" onsubmit="handlePlaceOrder(event)">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Full Name *</label>
              <input type="text" id="recipient_name" class="form-control" value="${escapeHtml(user.name || '')}" required placeholder="e.g. John Doe">
            </div>

            <div class="form-group">
              <label class="form-label">Phone Number *</label>
              <input type="tel" id="phone" class="form-control" value="${escapeHtml(user.phone || '')}" required placeholder="e.g. +1 555-019-2831">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Street Address *</label>
            <input type="text" id="shipping_address" class="form-control" value="${escapeHtml(user.address || '')}" required placeholder="e.g. 742 Evergreen Terrace, Suite 101">
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">City *</label>
              <input type="text" id="city" class="form-control" value="${escapeHtml(user.city || '')}" required placeholder="e.g. San Francisco">
            </div>

            <div class="form-group">
              <label class="form-label">State / Province *</label>
              <input type="text" id="state" class="form-control" value="${escapeHtml(user.state || '')}" required placeholder="e.g. California">
            </div>

            <div class="form-group">
              <label class="form-label">Postal / Zip Code *</label>
              <input type="text" id="postal_code" class="form-control" value="${escapeHtml(user.postal_code || '')}" required placeholder="e.g. 94105">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Delivery Notes / Landmark (Optional)</label>
            <textarea id="notes" class="form-control" rows="2" placeholder="e.g. Leave package with front security or ring bell #402"></textarea>
          </div>

          <!-- Payment Section -->
          <div style="margin-top: 2.5rem;">
            <h2 style="font-size: 1.4rem; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.6rem;">
              <i class="fas fa-credit-card" style="color: var(--primary);"></i>
              <span>2. Payment Method</span>
            </h2>

            <!-- Cash on Delivery Option -->
            <div class="payment-card-option selected" id="opt-cod" onclick="selectPayment('Cash on Delivery')">
              <input type="radio" name="payment_method" value="Cash on Delivery" checked>
              <div class="payment-details">
                <div class="payment-title">
                  <i class="fas fa-hand-holding-usd" style="color: var(--success); font-size: 1.2rem;"></i>
                  <span>Cash on Delivery (COD)</span>
                  <span class="badge" style="background: var(--success-light); color: var(--success); font-size: 0.7rem; margin-left: 0.5rem;">RECOMMENDED</span>
                </div>
                <div class="payment-desc">Pay in cash or UPI to the delivery courier upon doorstep package arrival.</div>
              </div>
            </div>

            <!-- Card Payment Option -->
            <div class="payment-card-option" id="opt-card" onclick="selectPayment('Credit/Debit Card')">
              <input type="radio" name="payment_method" value="Credit/Debit Card">
              <div class="payment-details">
                <div class="payment-title">
                  <i class="fas fa-credit-card" style="color: var(--primary); font-size: 1.2rem;"></i>
                  <span>Credit / Debit Card</span>
                </div>
                <div class="payment-desc">Safe simulated instant payment via Visa, Mastercard, or Amex.</div>
              </div>
            </div>

            <!-- UPI Payment Option -->
            <div class="payment-card-option" id="opt-upi" onclick="selectPayment('UPI / Net Banking')">
              <input type="radio" name="payment_method" value="UPI / Net Banking">
              <div class="payment-details">
                <div class="payment-title">
                  <i class="fas fa-qrcode" style="color: var(--secondary); font-size: 1.2rem;"></i>
                  <span>UPI / Net Banking</span>
                </div>
                <div class="payment-desc">Instant payment via Google Pay, PhonePe, Paytm, or Net Banking.</div>
              </div>
            </div>

            <!-- Card Simulation Sub-Form -->
            <div id="card-subform" style="display: none; background: var(--bg-subtle); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border); margin-bottom: 1.5rem;">
              <div class="form-group">
                <label class="form-label">Card Number</label>
                <input type="text" class="form-control" placeholder="4532 •••• •••• 8921" maxlength="19">
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Expiry (MM/YY)</label>
                  <input type="text" class="form-control" placeholder="12/28" maxlength="5">
                </div>
                <div class="form-group">
                  <label class="form-label">CVV</label>
                  <input type="password" class="form-control" placeholder="•••" maxlength="4">
                </div>
              </div>
            </div>
          </div>

          <div style="margin-top: 2rem;">
            <button type="submit" id="placeOrderBtn" class="btn btn-primary btn-block btn-lg">
              <i class="fas fa-check-circle"></i> Place Order (${API.formatPrice(checkoutSummary.total)})
            </button>
          </div>
        </form>
      </div>

      <!-- Order Review Sidebar -->
      <div>
        <div class="order-summary-card">
          <h3 style="font-size: 1.2rem; margin-bottom: 1.25rem;">Items in Order (${checkoutSummary.totalItems})</h3>

          <div style="display: flex; flex-direction: column; gap: 0.9rem; max-height: 280px; overflow-y: auto; padding-right: 0.5rem; margin-bottom: 1.5rem;">
            ${checkoutItems.map(item => `
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;">
                <img src="${item.image_url}" alt="${escapeHtml(item.name)}" style="width: 48px; height: 48px; border-radius: var(--radius-sm); object-fit: cover; border: 1px solid var(--border);">
                <div style="flex: 1; min-width: 0;">
                  <div style="font-weight: 600; font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(item.name)}</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">Qty: ${item.quantity} × ${API.formatPrice(item.price)}</div>
                </div>
                <div style="font-weight: 700; font-size: 0.9rem;">${API.formatPrice(item.price * item.quantity)}</div>
              </div>
            `).join('')}
          </div>

          <div class="summary-line">
            <span>Subtotal</span>
            <span>${API.formatPrice(checkoutSummary.subtotal)}</span>
          </div>

          <div class="summary-line">
            <span>Shipping</span>
            <span>${checkoutSummary.shippingFee === 0 ? '<span style="color: var(--success); font-weight: 700;">FREE</span>' : API.formatPrice(checkoutSummary.shippingFee)}</span>
          </div>

          <div class="summary-line">
            <span>Estimated Tax (5%)</span>
            <span>${API.formatPrice(checkoutSummary.estimatedTax)}</span>
          </div>

          <div class="summary-line total">
            <span>Total to Pay</span>
            <span style="color: var(--primary); font-size: 1.4rem;">${API.formatPrice(checkoutSummary.total)}</span>
          </div>

          <div style="margin-top: 1.5rem; background: var(--primary-light); padding: 0.9rem; border-radius: var(--radius-md); font-size: 0.85rem; color: var(--primary);">
            <i class="fas fa-shield-alt"></i> <b>Zero Risk Guarantee:</b> Inspect your items at delivery before paying for Cash on Delivery orders.
          </div>
        </div>
      </div>
    </div>
  `;
}

function selectPayment(method) {
  selectedPaymentMethod = method;
  document.querySelectorAll('.payment-card-option').forEach(el => el.classList.remove('selected'));
  
  const cardSubform = document.getElementById('card-subform');

  if (method === 'Cash on Delivery') {
    document.getElementById('opt-cod').classList.add('selected');
    document.querySelector('input[value="Cash on Delivery"]').checked = true;
    if (cardSubform) cardSubform.style.display = 'none';
  } else if (method === 'Credit/Debit Card') {
    document.getElementById('opt-card').classList.add('selected');
    document.querySelector('input[value="Credit/Debit Card"]').checked = true;
    if (cardSubform) cardSubform.style.display = 'block';
  } else if (method === 'UPI / Net Banking') {
    document.getElementById('opt-upi').classList.add('selected');
    document.querySelector('input[value="UPI / Net Banking"]').checked = true;
    if (cardSubform) cardSubform.style.display = 'none';
  }
}

async function handlePlaceOrder(e) {
  e.preventDefault();

  const btn = document.getElementById('placeOrderBtn');
  btn.disabled = true;
  btn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Processing Your Order...`;

  const payload = {
    recipient_name: document.getElementById('recipient_name').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    shipping_address: document.getElementById('shipping_address').value.trim(),
    city: document.getElementById('city').value.trim(),
    state: document.getElementById('state').value.trim(),
    postal_code: document.getElementById('postal_code').value.trim(),
    notes: document.getElementById('notes').value.trim(),
    payment_method: selectedPaymentMethod
  };

  if (isDirectBuy && directBuyProduct) {
    payload.items = [{
      productId: directBuyProduct.id,
      quantity: directBuyProduct.quantity
    }];
  }

  try {
    const res = await API.post('/orders', payload);
    const order = res.order;

    showToast('Order placed successfully!', 'success');
    API.updateCartBadge();

    setTimeout(() => {
      window.location.href = `/order-success.html?orderId=${order.id}&orderNumber=${order.order_number}`;
    }, 1000);
  } catch (err) {
    showToast(err.message || 'Failed to place order.', 'error');
    btn.disabled = false;
    btn.innerHTML = `<i class="fas fa-check-circle"></i> Place Order (${API.formatPrice(checkoutSummary.total)})`;
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
