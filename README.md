# 🛒 Full-Stack E-Commerce Web Application (Major Internship Project)

A complete, production-grade **E-Commerce Web Application** built using **HTML, CSS, JavaScript (Vanilla Frontend)**, **Node.js + Express.js (Backend)**, and **MySQL (Database)**.

---

## 🌟 Project Highlights & Modules

### 👤 1. Customer / User Module
- **Registration Page (`/login.html`):** User account registration with validation and profile setup.
- **Login Page (`/login.html`):** Secure authentication with JWT tokens & bcrypt password hashing.
- **Dashboard / Storefront (`/index.html`):** Responsive product catalog with instant category filtering, real-time live search, price sorting, discount badges, and quick add-to-cart.
- **Specific Product Page (`/product.html?id=...`):** High-resolution product images, live stock indicator, detailed specifications, quantity selector, "Add to Cart", "Buy Now", and verified customer review submission with star ratings.
- **Add to Cart (`/cart.html`):** Interactive shopping cart with quantity adjustments (+ / -), promo coupon discount engine (`SAVE10`, `WELCOME20`), tax calculation, shipping waiver ($100+ free shipping), and item removal.
- **Order Details & Checkout (`/checkout.html`):** User delivery details form (Recipient name, phone, street address, city, state, postal code, landmark notes) with order summary review.
- **Payment Page (`/checkout.html`):** Multiple payment methods including **Cash on Delivery (COD)**, Credit/Debit card simulation, and UPI / Net Banking.
- **Order Placed Notification (`/order-success.html`):** Visual confirmation with animated badge, unique Order Reference Number (`ORD-2026-XXXXX`), and delivery estimate.
- **View My Orders (`/orders.html`):** Real-time 4-step shipment tracker (*Placed → Processing → Shipped → Delivered*), itemized line receipts, delivery address info, and printable invoice generator.
- **Logout:** Secure session clearance and header state refresh.

---

### 👑 2. Administrator Module
- **Admin Login Page (`/admin-login.html`):** Dedicated secure login with role-based access verification (`admin`).
- **Admin Dashboard Overview (`/admin.html`):** Live executive KPI metrics:
  - 💰 *Total Revenue ($)*
  - 📦 *Total Orders Placed*
  - 🏷️ *Active Catalog Products*
  - 👥 *Registered Customers*
  - 📋 *Recent Customer Orders Feed*
- **Product Management & Add Product (`/admin.html` → Products Tab):**
  - View all products catalog with category, price, stock, and live ratings.
  - Interactive **Add Product Modal** (Title, Category, Price, Original Price, Stock, Brand, Image URL with live preview, Description, Featured toggle).
  - **Edit Product** modal for instant price/stock updates.
  - **Delete Product** with confirmation.
- **Orders Management (`/admin.html` → Orders Tab):**
  - View all customer orders across the platform.
  - Inspect itemized ordered products in modal.
  - Interactive **Order Status Updater** (*Placed*, *Processing*, *Shipped*, *Delivered*, *Cancelled*) with instant database synchronization.
- **Customers Directory (`/admin.html` → Customers Tab):**
  - View all registered customers, contact numbers, delivery addresses, total order counts, and total amount spent.
- **Admin Logout:** Dedicated session termination.

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | HTML5, CSS3 (Modern Design System), JavaScript (ES6+) | Vanilla JS with responsive design, glassmorphic UI, animations, Font Awesome 6 icons, Google Fonts (*Outfit* & *Plus Jakarta Sans*) |
| **Backend** | Node.js, Express.js | RESTful APIs, JWT Authentication, bcryptjs, CORS, Middleware architecture |
| **Database** | MySQL (with automatic connection pool & resilient fallback) | InnoDB relational schema with Foreign Keys, Cascading deletes, and indexing |

---

## 🚀 Quick Start & Setup Instructions

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **MySQL Server** (e.g., via XAMPP, WAMP, MySQL Server, or Docker)

### 2. Installation
Open your terminal in the project root and run:
```bash
npm install
```

### 3. Database Configuration (`.env`)
Create or edit `.env` in the root directory:
```env
PORT=5000
NODE_ENV=development

# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ecommerce_db

# JWT Secret
JWT_SECRET=super_secret_jwt_key_ecommerce_major_project_2026
JWT_EXPIRES_IN=7d
```

> **Note:** The server includes an automatic table generator and fallback engine. If MySQL is running, it creates the database and tables automatically on startup.

### 4. (Optional) Initialize MySQL Database explicitly
To run the database initializer script:
```bash
npm run init-db
```

### 5. Start the Application Server
```bash
npm start
```
Or for auto-reloading development:
```bash
npm run dev
```

Visit the application in your browser:
- 🌐 **Storefront:** [http://localhost:5000](http://localhost:5000)
- 👑 **Admin Portal:** [http://localhost:5000/admin-login.html](http://localhost:5000/admin-login.html)

---

## 🔑 Default Test Credentials

| Role | Email | Password | Quick Access |
|---|---|---|---|
| **👑 Super Admin** | `admin@ecommerce.com` | `admin123` | [Admin Portal](http://localhost:5000/admin-login.html) |
| **👤 Demo Customer** | `john@example.com` | `customer123` | [Sign In](http://localhost:5000/login.html) |
| **👤 Customer 2** | `emily@example.com` | `customer123` | [Sign In](http://localhost:5000/login.html) |

---

## 🗄️ Database Schema Structure

- `users` (id, name, email, password, role, phone, address, city, state, postal_code, created_at)
- `categories` (id, name, slug, icon, description, created_at)
- `products` (id, name, description, price, original_price, category_id, stock, image_url, rating, num_reviews, is_featured, brand, created_at)
- `cart_items` (id, user_id, product_id, quantity, created_at)
- `orders` (id, order_number, user_id, total_amount, shipping_fee, discount_amount, recipient_name, phone, shipping_address, city, state, postal_code, payment_method, payment_status, order_status, notes, created_at, updated_at)
- `order_items` (id, order_id, product_id, product_name, price, quantity, subtotal, image_url)
- `reviews` (id, product_id, user_id, user_name, rating, comment, created_at)

---

## 📂 Project Directory Architecture

```
E-commerce Website/
├── backend/
│   ├── config/
│   │   └── db.js                 # MySQL Pool & Resilient Fallback Engine
│   ├── controllers/
│   │   ├── authController.js     # User registration, login, profile
│   │   ├── productController.js  # Product catalog, filter, CRUD, reviews
│   │   ├── cartController.js     # Cart operations, quantity updates
│   │   ├── orderController.js    # Order placement, user history
│   │   └── adminController.js    # Admin metrics, order & customer management
│   ├── middleware/
│   │   └── authMiddleware.js     # JWT & Admin role verification
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   ├── cartRoutes.js
│   │   ├── orderRoutes.js
│   │   └── adminRoutes.js
│   └── database/
│       ├── schema.sql            # Raw MySQL schema
│       ├── seedData.js           # Sample products & initial users
│       └── init.js               # Standalone database initialization script
├── public/
│   ├── index.html                # Storefront Catalog Dashboard
│   ├── product.html              # Specific Product Details Page
│   ├── cart.html                 # Shopping Cart Page
│   ├── checkout.html             # Order Details & Payment Page (COD)
│   ├── order-success.html        # Order Placed Notification Page
│   ├── orders.html               # View My Orders & Tracking Page
│   ├── login.html                # Customer Sign In / Register Tabs
│   ├── admin-login.html          # Admin Portal Login
│   ├── admin.html                # Administrator Management Dashboard
│   ├── css/
│   │   ├── style.css             # Main Design System & UI Components
│   │   └── admin.css             # Admin Dashboard UI
│   └── js/
│       ├── api.js                # API Client, Token storage, utilities
│       ├── navbar.js             # Reactive Navbar & Footer component
│       ├── toast.js              # Toast Notification Engine
│       ├── main.js               # Storefront Catalog & Search logic
│       ├── product.js            # Product details, quantity & reviews
│       ├── cart.js               # Cart items, promo code, subtotal logic
│       ├── checkout.js           # Shipping form & Payment processing
│       ├── orders.js             # Order timeline tracking & invoice
│       ├── auth.js               # Login & Register logic
│       └── admin.js              # Admin KPIs, Products CRUD, Orders
├── .env.example
├── .env
├── package.json
├── server.js                     # Main Express server entry point
└── README.md
```

---

## 🎓 Perfect for Internship & College Major Project Presentation
- Clean MVC-style backend architecture.
- Full CRUD operations on products and orders.
- Role-based access control with JWT and password encryption.
- Modern responsive frontend with zero external heavy CSS frameworks.
- Cash on Delivery workflow matching standard industry practices.
