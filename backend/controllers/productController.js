const { query } = require('../config/db');

// Get all products with advanced filtering, searching, and sorting
async function getProducts(req, res) {
  try {
    const { category, search, minPrice, maxPrice, rating, sort, featured } = req.query;

    let products = await query(`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.id DESC
    `);

    // In-memory filter pipeline to guarantee identical behavior across MySQL and fallback
    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      products = products.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.category_name && p.category_name.toLowerCase().includes(q))
      );
    }

    if (category && category !== 'all') {
      const catId = Number(category);
      if (!isNaN(catId)) {
        products = products.filter(p => Number(p.category_id) === catId);
      } else {
        const target = category.toLowerCase().trim();
        const normTarget = target.replace(/[^a-z0-9]/g, '');
        products = products.filter(p => {
          const slug = (p.category_slug || '').toLowerCase().trim();
          const name = (p.category_name || '').toLowerCase().trim();
          const normSlug = slug.replace(/[^a-z0-9]/g, '');
          const normName = name.replace(/[^a-z0-9]/g, '');
          return slug === target || 
                 name === target || 
                 normSlug === normTarget || 
                 normName === normTarget ||
                 normName.includes(normTarget) ||
                 normSlug.includes(normTarget);
        });
      }
    }

    if (featured === 'true' || featured === '1') {
      products = products.filter(p => Boolean(p.is_featured));
    }

    if (minPrice && !isNaN(Number(minPrice))) {
      products = products.filter(p => Number(p.price) >= Number(minPrice));
    }

    if (maxPrice && !isNaN(Number(maxPrice))) {
      products = products.filter(p => Number(p.price) <= Number(maxPrice));
    }

    if (rating && !isNaN(Number(rating))) {
      products = products.filter(p => Number(p.rating) >= Number(rating));
    }

    // Sorting
    if (sort) {
      if (sort === 'price_asc') {
        products.sort((a, b) => Number(a.price) - Number(b.price));
      } else if (sort === 'price_desc') {
        products.sort((a, b) => Number(b.price) - Number(a.price));
      } else if (sort === 'rating_desc') {
        products.sort((a, b) => Number(b.rating) - Number(a.rating));
      } else if (sort === 'name_asc') {
        products.sort((a, b) => a.name.localeCompare(b.name));
      } else if (sort === 'newest') {
        products.sort((a, b) => Number(b.id) - Number(a.id));
      }
    }

    return res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    console.error('getProducts error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve products.' });
  }
}

// Get single product details + reviews
async function getProductById(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID.' });
    }

    const rows = await query(`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [id]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const product = rows[0];

    // Fetch reviews
    const reviews = await query(`
      SELECT r.*, u.name as user_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ?
      ORDER BY r.id DESC
    `, [id]);

    // Fetch related products in the same category
    let related = [];
    if (product.category_id) {
      const allCategoryProds = await query(`
        SELECT p.*, c.name as category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.category_id = ? AND p.id != ?
        LIMIT 4
      `, [product.category_id, id]);
      related = allCategoryProds.slice(0, 4);
    }

    return res.json({
      success: true,
      product,
      reviews: reviews || [],
      relatedProducts: related
    });
  } catch (error) {
    console.error('getProductById error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve product details.' });
  }
}

// Get all categories
async function getCategories(req, res) {
  try {
    const categories = await query('SELECT * FROM categories ORDER BY id ASC');
    return res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('getCategories error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve categories.' });
  }
}

// Admin: Create Product
async function createProduct(req, res) {
  try {
    const { name, description, price, original_price, category_id, stock, image_url, brand, is_featured } = req.body;

    if (!name || !description || price === undefined || !image_url) {
      return res.status(400).json({
        success: false,
        message: 'Product name, description, price, and image URL are required.'
      });
    }

    const result = await query(
      'INSERT INTO products (name, description, price, original_price, category_id, stock, image_url, brand, is_featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        name.trim(),
        description.trim(),
        Number(price),
        original_price ? Number(original_price) : null,
        category_id ? Number(category_id) : null,
        stock !== undefined ? Number(stock) : 10,
        image_url.trim(),
        brand ? brand.trim() : 'Store Brand',
        is_featured ? 1 : 0
      ]
    );

    const newId = result.insertId;
    return res.status(201).json({
      success: true,
      message: 'Product added successfully!',
      productId: newId
    });
  } catch (error) {
    console.error('createProduct error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create product.' });
  }
}

// Admin: Update Product
async function updateProduct(req, res) {
  try {
    const id = Number(req.params.id);
    const { name, description, price, original_price, category_id, stock, image_url, brand, is_featured } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID.' });
    }

    await query(
      `UPDATE products 
       SET name = ?, description = ?, price = ?, original_price = ?, category_id = ?, stock = ?, image_url = ?, brand = ?, is_featured = ?
       WHERE id = ?`,
      [
        name.trim(),
        description.trim(),
        Number(price),
        original_price ? Number(original_price) : null,
        category_id ? Number(category_id) : null,
        Number(stock),
        image_url.trim(),
        brand ? brand.trim() : 'Store Brand',
        is_featured ? 1 : 0,
        id
      ]
    );

    return res.json({
      success: true,
      message: 'Product updated successfully.'
    });
  } catch (error) {
    console.error('updateProduct error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update product.' });
  }
}

// Admin: Delete Product
async function deleteProduct(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID.' });
    }

    await query('DELETE FROM products WHERE id = ?', [id]);

    return res.json({
      success: true,
      message: 'Product deleted successfully.'
    });
  } catch (error) {
    console.error('deleteProduct error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete product.' });
  }
}

// Add Review
async function addReview(req, res) {
  try {
    const productId = Number(req.params.id);
    const { rating, comment } = req.body;
    const userId = req.user.id;
    const userName = req.user.name;

    if (!rating || !comment) {
      return res.status(400).json({ success: false, message: 'Rating and comment are required.' });
    }

    await query(
      'INSERT INTO reviews (product_id, user_id, user_name, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [productId, userId, userName, Number(rating), comment.trim()]
    );

    return res.status(201).json({
      success: true,
      message: 'Thank you for your review!'
    });
  } catch (error) {
    console.error('addReview error:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit review.' });
  }
}

module.exports = {
  getProducts,
  getProductById,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  addReview
};
