const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { query } = require('../config/db');
const { JWT_SECRET } = require('../middleware/authMiddleware');


// Register User (Customer or Admin)
async function register(req, res) {
  try {
    const { name, email, password, confirmPassword, avatar_url, phone, address, city, state, postal_code } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    // Confirm password matching verification
    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Password and Confirm Password do not match.' });
    }

    // Strong Password Policy:
    // 1. Min 8 characters
    // 2. At least 1 uppercase letter (A-Z)
    // 3. At least 1 lowercase letter (a-z)
    // 4. At least 1 number (0-9)
    // 5. At least 1 special symbol (@, #, $, %, !, &, *, etc.)
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ success: false, message: 'Password must contain at least one uppercase letter (A-Z).' });
    }
    if (!/[a-z]/.test(password)) {
      return res.status(400).json({ success: false, message: 'Password must contain at least one lowercase letter (a-z).' });
    }
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ success: false, message: 'Password must contain at least one number (0-9).' });
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`§±]/.test(password)) {
      return res.status(400).json({ success: false, message: 'Password must contain at least one special character (e.g. @, #, $, %, !).' });
    }

    // Check if user already exists
    const existingUsers = await query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existingUsers && existingUsers.length > 0) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists. Please log in.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Allow role selection: 'admin' or 'customer' (default: 'customer')
    const role = (req.body.role === 'admin' || req.body.role === 'administrator') ? 'admin' : 'customer';
    const defaultAvatar = avatar_url || (role === 'admin' 
      ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80' 
      : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80');

    const result = await query(
      'INSERT INTO users (name, email, password, role, avatar_url, phone, address, city, state, postal_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name.trim(), email.toLowerCase().trim(), hashedPassword, role, defaultAvatar, phone || null, address || null, city || null, state || null, postal_code || null]
    );

    const newUserId = result.insertId;

    // Generate JWT
    const token = jwt.sign(
      { id: newUserId, email: email.toLowerCase().trim(), role },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome aboard.',
      token,
      user: {
        id: newUserId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role,
        avatar_url: defaultAvatar,
        phone: phone || '',
        address: address || '',
        city: city || '',
        state: state || '',
        postal_code: postal_code || ''
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'Server error during registration. Please try again.' });
  }
}

// User Login (Customer Only — Admin/Staff must use /admin-login)
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
    }

    const users = await query('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (!users || users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = users[0];

    // STRICT ROLE CHECK: Customer login portal is ONLY for customers.
    // Do NOT reveal that the email belongs to staff — just return generic invalid credentials.
    const userRole = user.role ? String(user.role).toLowerCase().trim() : '';
    if (userRole !== 'customer') {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar_url: user.avatar_url || '',
      phone: user.phone || '',
      address: user.address || '',
      city: user.city || '',
      state: user.state || '',
      postal_code: user.postal_code || ''
    };

    return res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: safeUser
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login. Please try again.' });
  }
}

// Management & Staff Login (Admin & Delivery Staff)
async function adminLogin(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please enter your management email and password.' });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const users = await query('SELECT * FROM users WHERE email = ?', [cleanEmail]);
    if (!users || users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. No management account found with this email.' });
    }

    const user = users[0];
    const normalizedRole = user.role ? String(user.role).toLowerCase().trim() : '';

    if (normalizedRole === 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: This account is a Customer account. Please log in through the Customer storefront portal.'
      });
    }

    if (normalizedRole !== 'admin' && normalizedRole !== 'administrator' && normalizedRole !== 'delivery_agent' && normalizedRole !== 'staff') {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Account does not have management or staff privileges.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password. Access denied.' });
    }

    // Role-specific display name & token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: normalizedRole },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const defaultAvatar = normalizedRole === 'admin' || normalizedRole === 'administrator'
      ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80';

    return res.json({
      success: true,
      message: `Authenticated successfully. Welcome, ${user.name}! (${normalizedRole})`,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: normalizedRole,
        phone: user.phone || '',
        avatar_url: user.avatar_url || defaultAvatar,
        city: user.city || '',
        state: user.state || ''
      }
    });
  } catch (error) {
    console.error('Management login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during management authentication.' });
  }
}

// Get Current Logged In User Profile
async function getMe(req, res) {
  try {
    return res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error fetching user profile.' });
  }
}

// Update Profile (Photo, Name, Phone, Address, etc.)
async function updateProfile(req, res) {
  try {
    const { name, avatar_url, phone, address, city, state, postal_code } = req.body;
    const userId = req.user.id;

    await query(
      'UPDATE users SET name = COALESCE(?, name), avatar_url = COALESCE(?, avatar_url), phone = COALESCE(?, phone), address = COALESCE(?, address), city = COALESCE(?, city), state = COALESCE(?, state), postal_code = COALESCE(?, postal_code) WHERE id = ?',
      [
        name ? name.trim() : null,
        avatar_url ? avatar_url.trim() : null,
        phone !== undefined ? phone : null,
        address !== undefined ? address : null,
        city !== undefined ? city : null,
        state !== undefined ? state : null,
        postal_code !== undefined ? postal_code : null,
        userId
      ]
    );

    const updated = await query('SELECT id, name, email, role, avatar_url, phone, address, city, state, postal_code FROM users WHERE id = ?', [userId]);

    return res.json({
      success: true,
      message: 'Profile and avatar updated successfully!',
      user: updated[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
}

// Upload Profile Photo from Device (Base64 file upload)
async function uploadAvatar(req, res) {
  try {
    const { image } = req.body;
    const userId = req.user.id;

    if (!image) {
      return res.status(400).json({ success: false, message: 'No image data provided for upload.' });
    }

    // Match base64 prefix: e.g. data:image/png;base64,.....
    const matches = image.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    let ext = 'jpg';
    let base64Data = image;

    if (matches && matches.length === 3) {
      ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
      base64Data = matches[2];
    }

    const uploadDir = path.join(__dirname, '../../public/uploads/avatars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `avatar-${userId}-${Date.now()}.${ext}`;
    const filePath = path.join(uploadDir, filename);
    const relativeUrl = `/uploads/avatars/${filename}`;

    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);

    // Update database with new local photo path
    await query('UPDATE users SET avatar_url = ? WHERE id = ?', [relativeUrl, userId]);
    const updated = await query('SELECT id, name, email, role, avatar_url, phone, address, city, state, postal_code FROM users WHERE id = ?', [userId]);

    return res.json({
      success: true,
      message: 'Photo uploaded and saved successfully!',
      avatar_url: relativeUrl,
      user: updated[0]
    });
  } catch (error) {
    console.error('uploadAvatar error:', error);
    return res.status(500).json({ success: false, message: 'Failed to save uploaded photo.' });
  }
}

module.exports = {
  register,
  login,
  adminLogin,
  getMe,
  updateProfile,
  uploadAvatar
};
