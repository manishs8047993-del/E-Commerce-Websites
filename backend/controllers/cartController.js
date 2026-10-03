const { query } = require('../config/db');

// Get User Cart
async function getCart(req, res) {
  try {
    const userId = req.user.id;

    const items = await query(`
      SELECT 
        c.id as cart_item_id,
        c.user_id,
        c.product_id,
        c.quantity,
        p.name,
        p.price,
        p.original_price,
        p.image_url,
        p.stock,
        (p.price * c.quantity) as item_subtotal
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
      ORDER BY c.id DESC
    `, [userId]);

    const subtotal = items.reduce((acc, item) => acc + Number(item.item_subtotal || (item.price * item.quantity)), 0);
    const totalItems = items.reduce((acc, item) => acc + Number(item.quantity), 0);
    const shippingFee = subtotal > 100 || items.length === 0 ? 0 : 9.99;
    const estimatedTax = subtotal * 0.05; // 5% tax
    const total = subtotal + shippingFee + estimatedTax;

    return res.json({
      success: true,
      items,
      summary: {
        totalItems,
        subtotal: Number(subtotal.toFixed(2)),
        shippingFee: Number(shippingFee.toFixed(2)),
        estimatedTax: Number(estimatedTax.toFixed(2)),
        total: Number(total.toFixed(2))
      }
    });
  } catch (error) {
    console.error('getCart error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve shopping cart.' });
  }
}

// Add Item to Cart
async function addToCart(req, res) {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body;

    const prodId = Number(productId);
    const qty = Number(quantity);

    if (!prodId || isNaN(prodId) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Valid product ID and positive quantity are required.' });
    }

    // Verify product exists and has stock
    const products = await query('SELECT id, name, price, stock FROM products WHERE id = ?', [prodId]);
    if (!products || products.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const product = products[0];
    if (product.stock < qty) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} units available in stock.`
      });
    }

    // Check if item already exists in cart for this user
    const existing = await query('SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?', [userId, prodId]);

    if (existing && existing.length > 0) {
      const newQty = existing[0].quantity + qty;
      if (newQty > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more. Max stock limit (${product.stock}) reached.`
        });
      }

      await query('UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?', [newQty, existing[0].id, userId]);
    } else {
      await query('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)', [userId, prodId, qty]);
    }

    return res.json({
      success: true,
      message: `"${product.name}" added to your cart!`
    });
  } catch (error) {
    console.error('addToCart error:', error);
    return res.status(500).json({ success: false, message: 'Failed to add item to cart.' });
  }
}

// Update Cart Item Quantity
async function updateCartItem(req, res) {
  try {
    const userId = req.user.id;
    const cartItemId = Number(req.params.id);
    const { quantity } = req.body;
    const qty = Number(quantity);

    if (!cartItemId || isNaN(cartItemId) || qty < 1) {
      return res.status(400).json({ success: false, message: 'Invalid cart item ID or quantity.' });
    }

    // Find the cart item to check product stock
    const items = await query(`
      SELECT c.*, p.stock, p.name 
      FROM cart_items c 
      JOIN products p ON c.product_id = p.id 
      WHERE c.id = ? AND c.user_id = ?
    `, [cartItemId, userId]);

    if (!items || items.length === 0) {
      return res.status(404).json({ success: false, message: 'Cart item not found.' });
    }

    const item = items[0];
    if (qty > item.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${item.stock} units available in stock.`
      });
    }

    await query('UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?', [qty, cartItemId, userId]);

    return res.json({
      success: true,
      message: 'Cart quantity updated successfully.'
    });
  } catch (error) {
    console.error('updateCartItem error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update cart quantity.' });
  }
}

// Remove single item from cart
async function removeFromCart(req, res) {
  try {
    const userId = req.user.id;
    const cartItemId = Number(req.params.id);

    if (!cartItemId || isNaN(cartItemId)) {
      return res.status(400).json({ success: false, message: 'Invalid cart item ID.' });
    }

    await query('DELETE FROM cart_items WHERE user_id = ? AND id = ?', [userId, cartItemId]);

    return res.json({
      success: true,
      message: 'Item removed from your cart.'
    });
  } catch (error) {
    console.error('removeFromCart error:', error);
    return res.status(500).json({ success: false, message: 'Failed to remove item.' });
  }
}

// Clear all cart items for user
async function clearCart(req, res) {
  try {
    const userId = req.user.id;
    await query('DELETE FROM cart_items WHERE user_id = ?', [userId]);

    return res.json({
      success: true,
      message: 'Cart cleared successfully.'
    });
  } catch (error) {
    console.error('clearCart error:', error);
    return res.status(500).json({ success: false, message: 'Failed to clear cart.' });
  }
}

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};
