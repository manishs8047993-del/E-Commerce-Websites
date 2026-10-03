const bcrypt = require('bcryptjs');

async function getSeedData() {
  const hashedPasswordAdmin = await bcrypt.hash('admin123', 10);
  const hashedPasswordCustomer = await bcrypt.hash('customer123', 10);
  const hashedPasswordDelivery = await bcrypt.hash('deliverypass123', 10);

  const users = [
    {
      id: 1,
      name: 'System Admin',
      email: 'admin@ecommerce.com',
      password: hashedPasswordAdmin,
      role: 'admin',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      phone: '+1 800-555-0199',
      address: '742 Evergreen Terrace',
      city: 'Springfield',
      state: 'OR',
      postal_code: '97477',
      created_at: new Date('2026-01-10T10:00:00Z')
    },
    {
      id: 2,
      name: 'John Doe',
      email: 'john@example.com',
      password: hashedPasswordCustomer,
      role: 'customer',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
      phone: '+1 555-234-5678',
      address: '123 Tech Street, Apt 4B',
      city: 'San Jose',
      state: 'CA',
      postal_code: '95113',
      created_at: new Date('2026-02-15T14:30:00Z')
    },
    {
      id: 3,
      name: 'Emily Watson',
      email: 'emily@example.com',
      password: hashedPasswordCustomer,
      role: 'customer',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
      phone: '+1 555-876-5432',
      address: '456 Innovation Blvd',
      city: 'Austin',
      state: 'TX',
      postal_code: '78701',
      created_at: new Date('2026-03-01T09:15:00Z')
    },
    {
      id: 4,
      name: 'David Miller',
      email: 'david.delivery@ecommerce.com',
      password: hashedPasswordDelivery,
      role: 'delivery_agent',
      avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80',
      phone: '+1 555-9988',
      address: '88 Logistics Way',
      city: 'San Jose',
      state: 'CA',
      postal_code: '95113',
      created_at: new Date('2026-03-10T11:00:00Z')
    }
  ];

  const categories = [
    {
      id: 1,
      name: 'Smartphones & Mobiles',
      slug: 'mobiles',
      icon: 'fas fa-mobile-alt',
      description: 'Flagship 5G smartphones, foldable screen mobiles, fast charging devices, and premium accessories.'
    },
    {
      id: 2,
      name: 'Laptops & Computers',
      slug: 'laptops',
      icon: 'fas fa-laptop',
      description: 'High-performance workstation laptops, ultrabooks, creator displays, and desktop workstations.'
    },
    {
      id: 3,
      name: 'Fashion & Formal Apparel',
      slug: 'fashion-apparel',
      icon: 'fas fa-tshirt',
      description: 'Luxury evening gowns, Italian tailored suits, formal dresses, designer hoodies, and denim.'
    },
    {
      id: 4,
      name: 'Sports & Fitness',
      slug: 'sports-fitness',
      icon: 'fas fa-dumbbell',
      description: 'Adjustable dumbbells, marathon running shoes, yoga mats, fitness trackers, and gym gear.'
    },
    {
      id: 5,
      name: 'Pet Store & Supplies',
      slug: 'pet-supplies',
      icon: 'fas fa-paw',
      description: 'Orthopedic pet beds, smart automatic feeders, organic kibble, toys, and grooming essentials.'
    },
    {
      id: 6,
      name: 'Food & Groceries',
      slug: 'food-groceries',
      icon: 'fas fa-utensils',
      description: 'Artisanal roasted coffee, Swiss chocolates, organic matcha, Tuscan olive oil, and raw honey.'
    },
    {
      id: 7,
      name: 'Healthcare & Wellness',
      slug: 'healthcare-wellness',
      icon: 'fas fa-heartbeat',
      description: 'Smart blood pressure monitors, deep tissue massage guns, organic supplements, and wellness aids.'
    },
    {
      id: 8,
      name: 'Books & Media',
      slug: 'books-media',
      icon: 'fas fa-book-open',
      description: 'Bestselling hardcovers, software architecture books, glare-free e-readers, and vinyl audio.'
    },
    {
      id: 9,
      name: 'Toys & Games',
      slug: 'toys-games',
      icon: 'fas fa-shapes',
      description: 'Programmable STEM robotics, next-gen consoles, magnetic 3D building tiles, and RC cars.'
    },
    {
      id: 10,
      name: 'Baby Care & Motherhood',
      slug: 'baby-care',
      icon: 'fas fa-baby',
      description: 'Lightweight travel strollers, smart baby video monitors, organic bamboo swaddles, and carriers.'
    },
    {
      id: 11,
      name: 'Beauty & Personal Care',
      slug: 'beauty-personal-care',
      icon: 'fas fa-spa',
      description: '24K gold facial serums, ionic hair dryers, sonic toothbrushes, and precision grooming kits.'
    },
    {
      id: 12,
      name: 'Home & Kitchen Gadgets',
      slug: 'home-gadgets',
      icon: 'fas fa-home',
      description: 'Touch espresso machines, LiDAR robot vacuums, smart air purifiers, and ambient lamps.'
    }
  ];

  const products = [
    // ----------------------------------------------------
    // CATEGORY 1: Smartphones & Mobiles (id: 1..7)
    // ----------------------------------------------------
    {
      id: 1,
      name: 'ApexPro X1 Ultra 5G Smartphone (256GB Titanium)',
      description: 'Flagship smartphone featuring 6.8" 144Hz AMOLED LTPO display, 200MP periscope zoom camera, 4nm AI processor, titanium frame, and 5000mAh battery with 120W HyperCharge.',
      price: 999.00,
      original_price: 1199.00,
      category_id: 1,
      stock: 25,
      image_url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80',
      rating: 4.88,
      num_reviews: 64,
      is_featured: 1,
      brand: 'Apex Tech'
    },
    {
      id: 2,
      name: 'Nova Titan 16 Pro Max 5G (512GB Ceramic)',
      description: 'Aerospace grade titanium chassis, 48MP Triple Pro camera system with 5x optical zoom, Action button, All-day 29-hour video battery life, and A18 Pro Bionic chipset.',
      price: 1199.00,
      original_price: 1399.00,
      category_id: 1,
      stock: 18,
      image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80',
      rating: 4.95,
      num_reviews: 89,
      is_featured: 1,
      brand: 'NovaMobile'
    },
    {
      id: 3,
      name: 'Galaxy Stellar S24 Ultra AI Edition',
      description: 'Integrated S-Pen stylus, Quad Telephoto camera with 100x Space Zoom, Corning Gorilla Armor anti-reflective glass, and Live Translate AI call assistant.',
      price: 1049.00,
      original_price: 1249.00,
      category_id: 1,
      stock: 20,
      image_url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&auto=format&fit=crop&q=80',
      rating: 4.82,
      num_reviews: 52,
      is_featured: 0,
      brand: 'Stellar Tech'
    },
    {
      id: 4,
      name: 'FoldFlex 5G Dual-Screen Foldable Phone',
      description: 'Transform from a 6.2" cover screen to a massive 7.6" inner flexible dynamic OLED 120Hz display with zero-gap hinge and multi-task split windows.',
      price: 1499.00,
      original_price: 1799.00,
      category_id: 1,
      stock: 12,
      image_url: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&auto=format&fit=crop&q=80',
      rating: 4.79,
      num_reviews: 31,
      is_featured: 1,
      brand: 'Apex Tech'
    },
    {
      id: 5,
      name: 'Pixel Pure 9 Pro AI Flagship Phone',
      description: 'The pinnacle of computational photography with Super Res Zoom, Magic Editor, Gemini Advanced AI integration, and 7 years of OS updates.',
      price: 899.00,
      original_price: 999.00,
      category_id: 1,
      stock: 30,
      image_url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop&q=80',
      rating: 4.85,
      num_reviews: 44,
      is_featured: 0,
      brand: 'PixelCraft'
    },
    {
      id: 6,
      name: 'Horizon Pocket Flip 5G Foldable Phone',
      description: 'Compact clamshell design that folds neatly into your pocket, featuring external quick-reply OLED display, hands-free selfie camera, and IPX8 water resistance.',
      price: 849.00,
      original_price: 999.00,
      category_id: 1,
      stock: 18,
      image_url: 'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=800&auto=format&fit=crop&q=80',
      rating: 4.81,
      num_reviews: 29,
      is_featured: 0,
      brand: 'NovaMobile'
    },
    {
      id: 7,
      name: 'Apex Speed 5G Esports Gaming Smartphone (165Hz)',
      description: 'Built for competitive mobile gaming with ultrasonic shoulder triggers, ICE 12.0 active turbofan cooling, RGB light bar, and Snapdragon 8 Gen 3 chipset.',
      price: 749.00,
      original_price: 899.00,
      category_id: 1,
      stock: 22,
      image_url: 'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=800&auto=format&fit=crop&q=80',
      rating: 4.90,
      num_reviews: 46,
      is_featured: 0,
      brand: 'Apex Tech'
    },

    // ----------------------------------------------------
    // CATEGORY 2: Laptops & Computers (id: 8..14)
    // ----------------------------------------------------
    {
      id: 8,
      name: 'UltraBook Matrix 16 Pro (M3 Max, 32GB RAM, 1TB SSD)',
      description: 'Extreme performance laptop with 16.2" Liquid Retina XDR 120Hz mini-LED display, 16-core CPU, 40-core GPU, 32GB unified memory, and 22-hour battery life.',
      price: 1899.00,
      original_price: 2199.00,
      category_id: 2,
      stock: 15,
      image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
      rating: 4.96,
      num_reviews: 73,
      is_featured: 1,
      brand: 'Matrix Computing'
    },
    {
      id: 9,
      name: 'CarbonAir 14 Ultralight Business Laptop (0.99kg)',
      description: 'Weighs just 0.99kg with military-grade carbon fiber chassis, Intel Core Ultra 7 processor, 16GB LPDDR5X RAM, 512GB NVMe SSD, and 5G LTE eSIM slot.',
      price: 1299.00,
      original_price: 1499.00,
      category_id: 2,
      stock: 22,
      image_url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format&fit=crop&q=80',
      rating: 4.84,
      num_reviews: 41,
      is_featured: 1,
      brand: 'Matrix Computing'
    },
    {
      id: 10,
      name: 'StudioBook 4K OLED Touch Creator Workstation',
      description: '15.6" 4K OLED Pantone-validated touchscreen with stylus support, NVIDIA GeForce RTX 4070, physical Asus Dial controller, and dual Thunderbolt 4.',
      price: 1699.00,
      original_price: 1950.00,
      category_id: 2,
      stock: 14,
      image_url: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800&auto=format&fit=crop&q=80',
      rating: 4.90,
      num_reviews: 38,
      is_featured: 0,
      brand: 'VisionCraft'
    },
    {
      id: 11,
      name: 'Legion Predator 16" 240Hz Gaming Laptop (RTX 4080)',
      description: 'AMD Ryzen 9 7945HX, RTX 4080 12GB Graphics, ColdFront 5.0 vapor chamber liquid metal cooling, RGB per-key mechanical keyboard, and 32GB DDR5 RAM.',
      price: 1799.00,
      original_price: 2099.00,
      category_id: 2,
      stock: 10,
      image_url: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&auto=format&fit=crop&q=80',
      rating: 4.89,
      num_reviews: 54,
      is_featured: 1,
      brand: 'NovaGaming'
    },
    {
      id: 12,
      name: 'ZenFlip 360 2-in-1 Convertible OLED Laptop',
      description: 'Versatile 360-degree precision hinge for laptop, tablet, stand, and tent modes. 2.8K 90Hz OLED touch display, Intel Evo certified with 14hr battery.',
      price: 899.00,
      original_price: 1099.00,
      category_id: 2,
      stock: 28,
      image_url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80',
      rating: 4.75,
      num_reviews: 29,
      is_featured: 0,
      brand: 'Matrix Computing'
    },
    {
      id: 13,
      name: 'MiniWorkstation Pro Desktop Cube (Intel i9, 64GB)',
      description: 'Compact 4-liter aluminum chassis packed with 24-core i9 processor, 64GB DDR5 memory, dual 2TB PCIe Gen4 SSDs, and support for triple 4K monitors.',
      price: 1399.00,
      original_price: 1650.00,
      category_id: 2,
      stock: 16,
      image_url: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=800&auto=format&fit=crop&q=80',
      rating: 4.92,
      num_reviews: 33,
      is_featured: 0,
      brand: 'Matrix Computing'
    },
    {
      id: 14,
      name: 'Surface Pro 13" OLED Detachable 2-in-1 Tablet Laptop',
      description: 'Ultra-portable touchscreen 2-in-1 with Snapdragon X Elite AI NPU coprocessor, magnetic signature keyboard with pen storage, and all-day battery.',
      price: 999.00,
      original_price: 1199.00,
      category_id: 2,
      stock: 20,
      image_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&auto=format&fit=crop&q=80',
      rating: 4.83,
      num_reviews: 35,
      is_featured: 0,
      brand: 'Matrix Computing'
    },

    // ----------------------------------------------------
    // CATEGORY 3: Fashion & Formal Apparel (id: 15..21)
    // ----------------------------------------------------
    {
      id: 15,
      name: 'Royal Velvet Evening Formal Gown with Side Slit',
      description: 'Exquisite floor-length velvet evening dress featuring an asymmetrical neckline, side gathered drape, structured bodice, and flowing dramatic slit for gala events.',
      price: 229.00,
      original_price: 299.00,
      category_id: 3,
      stock: 20,
      image_url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&auto=format&fit=crop&q=80',
      rating: 4.93,
      num_reviews: 48,
      is_featured: 1,
      brand: 'Luxe Couture'
    },
    {
      id: 16,
      name: 'Bespoke Italian Wool 3-Piece Formal Tuxedo Suit',
      description: 'Handcrafted from Super 140s Italian merino wool. Includes slim-fit single-breasted jacket with satin shawl lapel, matching tailored vest, and flat-front trousers.',
      price: 349.00,
      original_price: 450.00,
      category_id: 3,
      stock: 16,
      image_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&auto=format&fit=crop&q=80',
      rating: 4.95,
      num_reviews: 62,
      is_featured: 1,
      brand: 'Sartorial London'
    },
    {
      id: 17,
      name: 'Classic Crisp Oxford 100% Cotton Formal Shirt',
      description: 'Wrinkle-resistant pinpoint Oxford weave formal business shirt with spread collar, mother-of-pearl buttons, and convertible French cuffs.',
      price: 65.00,
      original_price: 85.00,
      category_id: 3,
      stock: 60,
      image_url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80',
      rating: 4.80,
      num_reviews: 75,
      is_featured: 0,
      brand: 'Sartorial London'
    },
    {
      id: 18,
      name: 'Tailored Silk Satin Pleated Formal Cocktail Dress',
      description: 'Rich emerald green 100% mulberry silk cocktail dress with sunburst accordion pleats, removable waist tie sash, and concealed back zip closure.',
      price: 189.00,
      original_price: 240.00,
      category_id: 3,
      stock: 24,
      image_url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80',
      rating: 4.86,
      num_reviews: 39,
      is_featured: 0,
      brand: 'Luxe Couture'
    },
    {
      id: 19,
      name: 'Heavyweight French Terry Organic Cotton Hoodie',
      description: 'Ultra-plush heavyweight 500 GSM 100% organic cotton fleece with ribbed side panels, hidden pouch pocket, and double-layered warm hood.',
      price: 85.00,
      original_price: 110.00,
      category_id: 3,
      stock: 45,
      image_url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80',
      rating: 4.88,
      num_reviews: 76,
      is_featured: 1,
      brand: 'Urban Thread'
    },
    {
      id: 20,
      name: 'Japanese 14oz Raw Selvedge Denim Jeans',
      description: 'Shuttle-loomed dark indigo denim woven in Okayama, Japan. Features redline selvedge ID, copper rivets, and classic slim-straight cut.',
      price: 135.00,
      original_price: 175.00,
      category_id: 3,
      stock: 30,
      image_url: 'https://images.unsplash.com/photo-1542272604-780c96856592?w=800&auto=format&fit=crop&q=80',
      rating: 4.90,
      num_reviews: 64,
      is_featured: 0,
      brand: 'Luxe Wear'
    },
    {
      id: 21,
      name: 'Pure Mongolian Cashmere Crewneck Sweater',
      description: 'Grade-A 2-ply Mongolian cashmere offering luxurious softness and lightweight thermal insulation. Classic ribbed trim collar and cuffs.',
      price: 165.00,
      original_price: 220.00,
      category_id: 3,
      stock: 20,
      image_url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&auto=format&fit=crop&q=80',
      rating: 4.85,
      num_reviews: 38,
      is_featured: 0,
      brand: 'Luxe Wear'
    },

    // ----------------------------------------------------
    // CATEGORY 4: Sports & Fitness (id: 22..28)
    // ----------------------------------------------------
    {
      id: 22,
      name: 'Apex Pro Quick-Adjustable Dumbbells Set (5-52.5 lbs Pair)',
      description: 'Rapid dial adjustment system replacing 15 sets of weights in one compact footprint. Heavy-duty steel plates with ergonomic knurled grips.',
      price: 329.00,
      original_price: 399.00,
      category_id: 4,
      stock: 18,
      image_url: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&auto=format&fit=crop&q=80',
      rating: 4.94,
      num_reviews: 83,
      is_featured: 1,
      brand: 'Apex Fit'
    },
    {
      id: 23,
      name: 'AeroGlide Carbon Pro Marathon Running Shoes',
      description: 'Full-length carbon fiber propulsive plate, supercritical PEBA nitrogen-infused cushioning, adaptive breathable mesh upper, and high-traction rubber outsole.',
      price: 159.99,
      original_price: 210.00,
      category_id: 4,
      stock: 28,
      image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
      rating: 4.80,
      num_reviews: 63,
      is_featured: 1,
      brand: 'AeroSport'
    },
    {
      id: 24,
      name: 'UltraGrip Natural Tree Rubber Yoga Mat (6mm Extra Thick)',
      description: 'Non-slip polyurethane top layer with high-density natural rubber base, laser-engraved alignment lines, and sweat-absorbing textured surface.',
      price: 68.00,
      original_price: 89.00,
      category_id: 4,
      stock: 45,
      image_url: 'https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=800&auto=format&fit=crop&q=80',
      rating: 4.87,
      num_reviews: 55,
      is_featured: 0,
      brand: 'Apex Fit'
    },
    {
      id: 25,
      name: 'SpeedPulse Smart Jump Rope with Digital LED Jump Counter',
      description: 'Dual ball-bearing 360° spin mechanism, steel wire tangle-free cable, backlit LCD handle counter, and cordless weighted balls for indoor workout.',
      price: 29.99,
      original_price: 39.99,
      category_id: 4,
      stock: 60,
      image_url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80',
      rating: 4.73,
      num_reviews: 42,
      is_featured: 0,
      brand: 'Apex Fit'
    },
    {
      id: 26,
      name: 'CorePro Multi-Angle Foldable Incline Weight Bench',
      description: 'Commercial 800-pound load capacity, 7 backrest positions and 3 seat angles, high-density foam padding with tear-resistant leatherette.',
      price: 149.00,
      original_price: 189.00,
      category_id: 4,
      stock: 20,
      image_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
      rating: 4.89,
      num_reviews: 37,
      is_featured: 0,
      brand: 'Apex Fit'
    },
    {
      id: 27,
      name: 'HydroPro Insulated Gallon Stainless Steel Gym Jug (2.2L)',
      description: 'Double-wall vacuum insulation keeping water cold for 48 hours, leakproof chug straw lid, wide mouth for ice cubes, and heavy-duty carry handle.',
      price: 38.00,
      original_price: 49.00,
      category_id: 4,
      stock: 75,
      image_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80',
      rating: 4.82,
      num_reviews: 68,
      is_featured: 0,
      brand: 'Apex Fit'
    },
    {
      id: 28,
      name: 'PowerFlex Heavy Duty Latex Resistance Loop Bands (5-Pack)',
      description: '100% natural Malaysian latex bands offering 10 to 150 lbs of stackable resistance with cushioned foam handles and door anchor.',
      price: 24.99,
      original_price: 35.00,
      category_id: 4,
      stock: 90,
      image_url: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=800&auto=format&fit=crop&q=80',
      rating: 4.79,
      num_reviews: 91,
      is_featured: 0,
      brand: 'Apex Fit'
    },

    // ----------------------------------------------------
    // CATEGORY 5: Pet Store & Supplies (id: 29..35)
    // ----------------------------------------------------
    {
      id: 29,
      name: 'Orthopedic Memory Foam Velvet Dog & Cat Sofa Bed',
      description: 'Medical-grade egg-crate memory foam core relieving pet joint pressure, water-resistant removable zippered plush cover, and non-skid bottom.',
      price: 69.99,
      original_price: 89.99,
      category_id: 5,
      stock: 35,
      image_url: 'https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?w=800&auto=format&fit=crop&q=80',
      rating: 4.91,
      num_reviews: 74,
      is_featured: 1,
      brand: 'PawHaven'
    },
    {
      id: 30,
      name: 'Smart Automatic Pet Feeder with 1080p Camera & Audio',
      description: 'Schedule automated portion-controlled meals via smartphone app, 1080p wide-angle night vision camera, 2-way microphone, and backup battery power.',
      price: 119.00,
      original_price: 149.00,
      category_id: 5,
      stock: 24,
      image_url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&auto=format&fit=crop&q=80',
      rating: 4.88,
      num_reviews: 58,
      is_featured: 1,
      brand: 'PawHaven'
    },
    {
      id: 31,
      name: 'Ultra-Quiet Stainless Steel Waterfall Pet Fountain (3.2L)',
      description: 'Triple filtration system with coconut shell activated carbon, food-grade 304 stainless steel basin, and ultra-silent submersible water pump (<20dB).',
      price: 36.99,
      original_price: 48.00,
      category_id: 5,
      stock: 50,
      image_url: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=800&auto=format&fit=crop&q=80',
      rating: 4.83,
      num_reviews: 62,
      is_featured: 0,
      brand: 'PawHaven'
    },
    {
      id: 32,
      name: 'Grain-Free Organic Salmon & Sweet Potato Kibble (5kg)',
      description: 'Rich in wild Alaskan salmon, probiotics, omega-3 fatty acids for shiny coat, zero artificial preservatives, corn, wheat, or soy fillers.',
      price: 44.50,
      original_price: 55.00,
      category_id: 5,
      stock: 60,
      image_url: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800&auto=format&fit=crop&q=80',
      rating: 4.95,
      num_reviews: 89,
      is_featured: 0,
      brand: 'PawHaven'
    },
    {
      id: 33,
      name: 'Multi-Level Plush Cat Tree Tower with Sisal Scratching Posts',
      description: '60-inch sturdy cat activity center with roomy condos, hanging plush hammocks, durable natural sisal scratching posts, and anti-toppling kit.',
      price: 89.00,
      original_price: 115.00,
      category_id: 5,
      stock: 20,
      image_url: 'https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=800&auto=format&fit=crop&q=80',
      rating: 4.86,
      num_reviews: 43,
      is_featured: 0,
      brand: 'PawHaven'
    },
    {
      id: 34,
      name: 'Heavy-Duty Retractable No-Tangle Dog Leash (16ft LED)',
      description: 'Reinforced nylon tape for dogs up to 110 lbs, one-touch quick brake and lock mechanism, built-in LED flashlight for night walks, and waste bag holder.',
      price: 22.99,
      original_price: 29.99,
      category_id: 5,
      stock: 80,
      image_url: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&auto=format&fit=crop&q=80',
      rating: 4.77,
      num_reviews: 51,
      is_featured: 0,
      brand: 'PawHaven'
    },
    {
      id: 35,
      name: 'Interactive Robotic Laser & Feather Automatic Cat Toy',
      description: '360-degree irregular auto-rotating laser beam and fluttering feather wand that stimulates pet hunting instincts with smart auto-shutoff timer.',
      price: 27.00,
      original_price: 36.00,
      category_id: 5,
      stock: 65,
      image_url: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800&auto=format&fit=crop&q=80',
      rating: 4.72,
      num_reviews: 38,
      is_featured: 0,
      brand: 'PawHaven'
    },

    // ----------------------------------------------------
    // CATEGORY 6: Food & Groceries (id: 36..42)
    // ----------------------------------------------------
    {
      id: 36,
      name: 'Single-Origin Ethiopian Yirgacheffe Roasted Coffee (1kg)',
      description: '100% Arabica artisanal whole bean coffee roasted in small batches. Distinct floral jasmine aroma with bright citrus bergamot and honey notes.',
      price: 32.99,
      original_price: 42.00,
      category_id: 6,
      stock: 80,
      image_url: 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=800&auto=format&fit=crop&q=80',
      rating: 4.96,
      num_reviews: 115,
      is_featured: 1,
      brand: 'RoastMasters'
    },
    {
      id: 37,
      name: 'Handcrafted Swiss 85% Dark Chocolate Truffle Box (24 Pcs)',
      description: 'Velvety grand cru cocoa truffles dusted with Dutch cocoa powder, filled with hazelnut praline, salted caramel, and raspberry ganache.',
      price: 28.50,
      original_price: 36.00,
      category_id: 6,
      stock: 90,
      image_url: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=800&auto=format&fit=crop&q=80',
      rating: 4.92,
      num_reviews: 98,
      is_featured: 1,
      brand: 'Chocolatier Grand'
    },
    {
      id: 38,
      name: 'Organic Ceremonial Japanese Uji Matcha Powder (100g)',
      description: 'First harvest shade-grown stone-ground tencha leaves from Kyoto, Japan. Vibrant emerald green color, smooth umami flavor, and rich antioxidant L-theanine.',
      price: 26.00,
      original_price: 34.00,
      category_id: 6,
      stock: 65,
      image_url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=800&auto=format&fit=crop&q=80',
      rating: 4.89,
      num_reviews: 74,
      is_featured: 0,
      brand: 'TeaZen Kyoto'
    },
    {
      id: 39,
      name: 'Cold-Pressed Extra Virgin Tuscan Olive Oil (750ml)',
      description: 'First cold-extracted extra virgin olive oil from centuries-old Tuscan groves. Peppery finish with aroma of fresh artichoke, green almond, and fresh grass.',
      price: 24.99,
      original_price: 32.00,
      category_id: 6,
      stock: 70,
      image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&auto=format&fit=crop&q=80',
      rating: 4.85,
      num_reviews: 53,
      is_featured: 0,
      brand: 'Tuscany Harvest'
    },
    {
      id: 40,
      name: 'Gourmet Roasted Nut & Wild Berry Medley (500g)',
      description: 'Dry roasted California almonds, whole cashews, organic walnuts, dried cranberries, wild blueberries, and pumpkin seeds lightly seasoned with pink salt.',
      price: 18.99,
      original_price: 24.00,
      category_id: 6,
      stock: 100,
      image_url: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=800&auto=format&fit=crop&q=80',
      rating: 4.81,
      num_reviews: 82,
      is_featured: 0,
      brand: 'NatureCrunch'
    },
    {
      id: 41,
      name: 'Pure Raw Himalayan Mountain Wildflower Honey (1kg)',
      description: '100% unpasteurized raw honey harvested by indigenous beekeepers from high-altitude flora. Naturally rich in bee pollen, enzymes, and delicate floral aroma.',
      price: 22.00,
      original_price: 28.00,
      category_id: 6,
      stock: 85,
      image_url: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&auto=format&fit=crop&q=80',
      rating: 4.94,
      num_reviews: 87,
      is_featured: 1,
      brand: 'PureWild'
    },
    {
      id: 42,
      name: 'Sparkling Botanical Artisan Blood Orange Soda (6 x 330ml)',
      description: 'Naturally fermented sparkling beverage infused with Sicilian blood orange, Meyer lemon, rosemary sprigs, and pure mineral spring water.',
      price: 15.99,
      original_price: 20.00,
      category_id: 6,
      stock: 95,
      image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80',
      rating: 4.70,
      num_reviews: 43,
      is_featured: 0,
      brand: 'PureWild'
    },

    // ----------------------------------------------------
    // CATEGORY 7: Healthcare & Wellness (id: 43..49)
    // ----------------------------------------------------
    {
      id: 43,
      name: 'Smart Upper Arm Digital Blood Pressure Monitor with App',
      description: 'Clinically validated accurate oscillometric reading, irregular heartbeat detection, Bluetooth auto-sync to Apple Health and Google Fit.',
      price: 49.99,
      original_price: 69.99,
      category_id: 7,
      stock: 45,
      image_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80',
      rating: 4.90,
      num_reviews: 86,
      is_featured: 1,
      brand: 'HealthGuard'
    },
    {
      id: 44,
      name: 'Deep Tissue Percussion Muscle Massage Gun (6 Heads)',
      description: 'High-torque brushless motor delivering up to 3200 RPM, 30 speed levels, ultra-quiet quiet-glide technology, and 6-hour lithium battery.',
      price: 79.00,
      original_price: 119.00,
      category_id: 7,
      stock: 35,
      image_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=80',
      rating: 4.93,
      num_reviews: 94,
      is_featured: 1,
      brand: 'HealthGuard'
    },
    {
      id: 45,
      name: 'Infrared Medical No-Touch Forehead & Ear Thermometer',
      description: 'Instant 1-second accurate temperature reading with color-coded fever alarm, silent night mode for sleeping children, and 35-reading memory.',
      price: 24.99,
      original_price: 34.99,
      category_id: 7,
      stock: 70,
      image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80',
      rating: 4.82,
      num_reviews: 67,
      is_featured: 0,
      brand: 'HealthGuard'
    },
    {
      id: 46,
      name: 'Wild Alaskan Triple-Strength Omega-3 Fish Oil (120 Softgels)',
      description: '2400mg fish oil with 1600mg EPA & DHA per serving. Molecularly distilled for absolute purity with zero fishy aftertaste or burps.',
      price: 29.99,
      original_price: 38.00,
      category_id: 7,
      stock: 80,
      image_url: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=800&auto=format&fit=crop&q=80',
      rating: 4.88,
      num_reviews: 104,
      is_featured: 0,
      brand: 'NutriPure'
    },
    {
      id: 47,
      name: 'Natural Melatonin, L-Theanine & Magnesium Sleep Gummies',
      description: 'Drug-free restful sleep support gummies with passionflower and chamomile extract. Non-habit forming with delicious natural blackberry flavor.',
      price: 19.99,
      original_price: 26.00,
      category_id: 7,
      stock: 90,
      image_url: 'https://images.unsplash.com/photo-1550572017-ed24c0840506?w=800&auto=format&fit=crop&q=80',
      rating: 4.76,
      num_reviews: 78,
      is_featured: 0,
      brand: 'NutriPure'
    },
    {
      id: 48,
      name: 'Smart Portable Ultrasonic Mesh Nebulizer & Inhaler',
      description: 'Pocket-sized silent mesh technology creating ultra-fine mist particles (<5um) for efficient respiratory relief for adults and children.',
      price: 39.00,
      original_price: 52.00,
      category_id: 7,
      stock: 40,
      image_url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80',
      rating: 4.84,
      num_reviews: 45,
      is_featured: 0,
      brand: 'HealthGuard'
    },
    {
      id: 49,
      name: 'Ergonomic Memory Foam Orthopedic Lumbar Pillow',
      description: 'Contoured spinal alignment cushion with breathable 3D mesh cover and dual adjustable straps for office chairs and car seats.',
      price: 34.50,
      original_price: 45.00,
      category_id: 7,
      stock: 60,
      image_url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=80',
      rating: 4.80,
      num_reviews: 53,
      is_featured: 0,
      brand: 'ErgoMaster'
    },

    // ----------------------------------------------------
    // CATEGORY 8: Books & Media (id: 50..55)
    // ----------------------------------------------------
    {
      id: 50,
      name: 'Clean Architecture & Microservices Design (Hardcover)',
      description: 'Comprehensive software engineering handbook detailing domain-driven design, decoupling strategies, fault tolerance, and scalable cloud APIs.',
      price: 48.00,
      original_price: 60.00,
      category_id: 8,
      stock: 50,
      image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
      rating: 4.96,
      num_reviews: 82,
      is_featured: 1,
      brand: 'TechPress Publishing'
    },
    {
      id: 51,
      name: 'Atomic Habits: Tiny Changes, Remarkable Results',
      description: 'The definitive guide to breaking bad routines, harnessing compound self-improvement, and optimizing daily productivity systems.',
      price: 21.00,
      original_price: 28.00,
      category_id: 8,
      stock: 95,
      image_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&auto=format&fit=crop&q=80',
      rating: 4.95,
      num_reviews: 140,
      is_featured: 1,
      brand: 'BookWorld'
    },
    {
      id: 52,
      name: 'NovaReader 7" Waterproof Glare-Free E-Reader',
      description: '300 PPI Paperwhite touchscreen with adjustable warm light, IPX8 waterproofing for bathtub reading, 32GB storage holding thousands of books.',
      price: 139.00,
      original_price: 169.00,
      category_id: 8,
      stock: 35,
      image_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80',
      rating: 4.89,
      num_reviews: 71,
      is_featured: 0,
      brand: 'NovaTech'
    },
    {
      id: 53,
      name: 'The Art of Neural Networks & Large Language Models',
      description: 'Insightful guide covering transformer architectures, reinforcement learning from human feedback (RLHF), and agentic autonomous coding paradigms.',
      price: 54.00,
      original_price: 70.00,
      category_id: 8,
      stock: 40,
      image_url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&auto=format&fit=crop&q=80',
      rating: 4.92,
      num_reviews: 49,
      is_featured: 0,
      brand: 'TechPress Publishing'
    },
    {
      id: 54,
      name: 'Retro Hi-Fi Belt-Drive Vinyl Turntable with Bluetooth',
      description: 'Precision Audio-Technica magnetic cartridge, built-in switchable preamp, anti-resonance wooden plinth, and wireless vinyl streaming.',
      price: 199.50,
      original_price: 249.00,
      category_id: 8,
      stock: 20,
      image_url: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&auto=format&fit=crop&q=80',
      rating: 4.87,
      num_reviews: 36,
      is_featured: 0,
      brand: 'AudioPhile Classic'
    },
    {
      id: 55,
      name: 'Studio Reference Over-Ear Monitoring Headphones',
      description: 'Closed-back dynamic 50mm drivers providing flat, neutral frequency response for mastering audio engineers, podcasters, and musicians.',
      price: 149.00,
      original_price: 189.00,
      category_id: 8,
      stock: 30,
      image_url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80',
      rating: 4.83,
      num_reviews: 57,
      is_featured: 0,
      brand: 'SonicWave'
    },

    // ----------------------------------------------------
    // CATEGORY 9: Toys & Games (id: 56..61)
    // ----------------------------------------------------
    {
      id: 56,
      name: 'Modular STEM Programmable Robotics Kit (850 Pieces)',
      description: 'Build and code 10 different interactive robots using graphical scratch block or Python programming. Features ultrasonic sensors and Bluetooth motor hub.',
      price: 129.00,
      original_price: 159.00,
      category_id: 9,
      stock: 25,
      image_url: 'https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=800&auto=format&fit=crop&q=80',
      rating: 4.94,
      num_reviews: 63,
      is_featured: 1,
      brand: 'RoboPlay'
    },
    {
      id: 57,
      name: 'NovaConsole X Ultimate Edition (1TB SSD, 4K 120Hz)',
      description: 'Next-generation console with custom AMD RDNA 3 graphics, ray tracing architecture, ultra-fast 1TB NVMe SSD loading, and bundled dual wireless haptic controllers.',
      price: 549.99,
      original_price: 599.99,
      category_id: 9,
      stock: 20,
      image_url: 'https://images.unsplash.com/photo-1486401899868-0e435ed85128?w=800&auto=format&fit=crop&q=80',
      rating: 4.96,
      num_reviews: 142,
      is_featured: 1,
      brand: 'NovaGaming'
    },
    {
      id: 58,
      name: 'Magnetic 3D Translucent Building Tiles Architecture Set (100 Pcs)',
      description: 'Food-grade BPA-free magnetic geometric shapes empowering children to construct towering 3D castles, bridges, and geometric structures safely.',
      price: 49.99,
      original_price: 65.00,
      category_id: 9,
      stock: 60,
      image_url: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80',
      rating: 4.88,
      num_reviews: 91,
      is_featured: 0,
      brand: 'RoboPlay'
    },
    {
      id: 59,
      name: 'High-Speed All-Terrain 4WD RC Monster Rock Crawler',
      description: '1:14 scale off-road remote control truck with independent oil shocks, 45km/h top speed, dual LED headlights, and 2.4GHz proportional controller.',
      price: 69.00,
      original_price: 89.00,
      category_id: 9,
      stock: 35,
      image_url: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=800&auto=format&fit=crop&q=80',
      rating: 4.79,
      num_reviews: 48,
      is_featured: 0,
      brand: 'SpeedGear'
    },
    {
      id: 60,
      name: 'Handheld Retro 16-Bit Arcade Gaming Console (500 Games)',
      description: 'Crisp 3.5" IPS display, rechargeable battery, AV cable TV out support, and pre-loaded with hundreds of beloved classic retro arcade games.',
      price: 39.99,
      original_price: 55.00,
      category_id: 9,
      stock: 55,
      image_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
      rating: 4.75,
      num_reviews: 52,
      is_featured: 0,
      brand: 'NovaGaming'
    },
    {
      id: 61,
      name: 'Obstacle-Avoidance Gesture Controlled Mini Drone with LED',
      description: 'Safe propeller guards, 360-degree infrared sensor obstacle avoidance, hands-free gesture control mode, and one-key takeoff and landing.',
      price: 44.00,
      original_price: 59.00,
      category_id: 9,
      stock: 45,
      image_url: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=800&auto=format&fit=crop&q=80',
      rating: 4.81,
      num_reviews: 39,
      is_featured: 0,
      brand: 'RoboPlay'
    },

    // ----------------------------------------------------
    // CATEGORY 10: Baby Care & Motherhood (id: 62..67)
    // ----------------------------------------------------
    {
      id: 62,
      name: 'Ultra-Compact Foldable 3-in-1 Baby Travel Stroller',
      description: 'One-hand instant fold system weighing only 6.2kg, aircraft overhead compartment approved, multi-position recline, and UPF 50+ canopy.',
      price: 189.00,
      original_price: 249.00,
      category_id: 10,
      stock: 18,
      image_url: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800&auto=format&fit=crop&q=80',
      rating: 4.93,
      num_reviews: 56,
      is_featured: 1,
      brand: 'BabyComfort'
    },
    {
      id: 63,
      name: 'Smart HD Video Baby Monitor with Night Vision & Temp Sensor',
      description: '5" IPS parent display with 1000ft range, 2-way talkback intercom, room temperature monitoring, soothing lullabies, and zero Wi-Fi security hack risk.',
      price: 89.99,
      original_price: 119.00,
      category_id: 10,
      stock: 30,
      image_url: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&auto=format&fit=crop&q=80',
      rating: 4.87,
      num_reviews: 68,
      is_featured: 1,
      brand: 'BabyComfort'
    },
    {
      id: 64,
      name: 'Fast Steam Baby Bottle Warmer & Sanitizer with Timer',
      description: 'Warms milk gently in 3 minutes without hotspots, universal fit for all bottle brands, 24-hour thermostat defrost, and steam sanitation.',
      price: 39.99,
      original_price: 52.00,
      category_id: 10,
      stock: 45,
      image_url: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&auto=format&fit=crop&q=80',
      rating: 4.82,
      num_reviews: 47,
      is_featured: 0,
      brand: 'BabyComfort'
    },
    {
      id: 65,
      name: '100% Organic Bamboo Soft Baby Swaddles (Pack of 4)',
      description: 'Extra-large 47x47 inch breathable silky soft bamboo muslin wraps that get softer with every wash. Gentle on sensitive newborn skin.',
      price: 28.00,
      original_price: 36.00,
      category_id: 10,
      stock: 75,
      image_url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop&q=80',
      rating: 4.95,
      num_reviews: 83,
      is_featured: 0,
      brand: 'BabyComfort'
    },
    {
      id: 66,
      name: 'Ergonomic 6-in-1 Baby Hip Seat Carrier (Newborn to Toddler)',
      description: 'Padded lumbar waist support transferring weight off mother shoulders, 3D memory foam hip seat, breathable mesh panel, and sun hood.',
      price: 49.50,
      original_price: 65.00,
      category_id: 10,
      stock: 35,
      image_url: 'https://images.unsplash.com/photo-1544126592-807ade215a0b?w=800&auto=format&fit=crop&q=80',
      rating: 4.89,
      num_reviews: 62,
      is_featured: 0,
      brand: 'BabyComfort'
    },
    {
      id: 67,
      name: 'Food-Grade Silicone Suction Feeding Bowl & Bib Set',
      description: 'Strong suction base preventing food spills, adjustable catch-all silicone bib, soft silicone training spoon and fork, 100% microwave safe.',
      price: 21.99,
      original_price: 29.99,
      category_id: 10,
      stock: 90,
      image_url: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80',
      rating: 4.79,
      num_reviews: 54,
      is_featured: 0,
      brand: 'BabyComfort'
    },

    // ----------------------------------------------------
    // CATEGORY 11: Beauty & Personal Care (id: 68..73)
    // ----------------------------------------------------
    {
      id: 68,
      name: '24K Gold & Squalane Age-Defying Facial Serum (50ml)',
      description: 'Infused with real 24K gold flakes, pure plant-derived squalane, hyaluronic acid, and niacinamide to restore elasticity and youthful glow.',
      price: 45.00,
      original_price: 65.00,
      category_id: 11,
      stock: 50,
      image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80',
      rating: 4.92,
      num_reviews: 79,
      is_featured: 1,
      brand: 'GlowLuxe'
    },
    {
      id: 69,
      name: 'High-Speed Ionic Hair Dryer with Magnetic Nozzles',
      description: '110,000 RPM brushless digital motor drying hair in half the time, 200 million negative ions eliminating frizz, and smart heat sensor.',
      price: 129.00,
      original_price: 179.00,
      category_id: 11,
      stock: 28,
      image_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80',
      rating: 4.90,
      num_reviews: 64,
      is_featured: 1,
      brand: 'GlowLuxe'
    },
    {
      id: 70,
      name: 'Sonic Electric Toothbrush with 40,000 VPM & Travel Case',
      description: 'DuPont diamond bristles, 5 custom cleaning modes (Clean, White, Polish, Gum Care, Sensitive), smart 2-minute timer, and 60-day battery charge.',
      price: 42.00,
      original_price: 58.00,
      category_id: 11,
      stock: 65,
      image_url: 'https://images.unsplash.com/photo-1559591937-e10323971e41?w=800&auto=format&fit=crop&q=80',
      rating: 4.86,
      num_reviews: 88,
      is_featured: 0,
      brand: 'GlowLuxe'
    },
    {
      id: 71,
      name: 'Dead Sea Mineral Purifying Mud Mask (250g)',
      description: 'Authentic Dead Sea mud with kaolin clay, jojoba oil, and aloe vera. Gently unclogs pores, extracts blackheads, and nourishes skin.',
      price: 22.50,
      original_price: 30.00,
      category_id: 11,
      stock: 80,
      image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80',
      rating: 4.83,
      num_reviews: 73,
      is_featured: 0,
      brand: 'GlowLuxe'
    },
    {
      id: 72,
      name: 'Organic Cold-Pressed Moroccan Argan Oil for Hair & Skin (100ml)',
      description: '100% pure virgin Argan oil rich in Vitamin E. Tames split ends, hydrates dry skin, and strengthens fragile nails without greasy residue.',
      price: 24.00,
      original_price: 32.00,
      category_id: 11,
      stock: 70,
      image_url: 'https://images.unsplash.com/photo-1608248597359-545239a5ff63?w=800&auto=format&fit=crop&q=80',
      rating: 4.89,
      num_reviews: 95,
      is_featured: 0,
      brand: 'GlowLuxe'
    },
    {
      id: 73,
      name: 'Professional Waterproof Titanium Beard & Hair Trimmer',
      description: 'Self-sharpening titanium T-blade, LCD battery indicator, 4 guide combs, USB fast charging, and IPX7 washable body for wet and dry trimming.',
      price: 38.99,
      original_price: 49.99,
      category_id: 11,
      stock: 55,
      image_url: 'https://images.unsplash.com/photo-1621607512214-68297480165e?w=800&auto=format&fit=crop&q=80',
      rating: 4.78,
      num_reviews: 58,
      is_featured: 0,
      brand: 'GlowLuxe'
    },

    // ----------------------------------------------------
    // CATEGORY 12: Home & Kitchen Gadgets (id: 74..79)
    // ----------------------------------------------------
    {
      id: 74,
      name: 'Barista Touch Compact 15-Bar Espresso & Latte Machine',
      description: '15-bar Italian pump with ThermoJet heating in 3 seconds, integrated conical burr grinder, automatic microfoam milk texturing, and LCD touchscreen interface.',
      price: 499.00,
      original_price: 599.00,
      category_id: 12,
      stock: 14,
      image_url: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&auto=format&fit=crop&q=80',
      rating: 4.94,
      num_reviews: 59,
      is_featured: 1,
      brand: 'Aura Living'
    },
    {
      id: 75,
      name: 'AuraGlow Smart Ambient Desk Lamp & Fast Wireless Charger',
      description: 'Modern minimalist curved arch lamp with 16 million RGB color choices, circadian rhythm sync, built-in 15W Qi wireless fast charging pad, and HomeKit & Alexa support.',
      price: 89.00,
      original_price: 119.00,
      category_id: 12,
      stock: 50,
      image_url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80',
      rating: 4.75,
      num_reviews: 41,
      is_featured: 0,
      brand: 'Aura Living'
    },
    {
      id: 76,
      name: 'PureBreeze True HEPA Smart Air Purifier',
      description: 'Covers up to 1000 sq ft with medical-grade H13 HEPA filter, laser particle air quality sensor, whisper-quiet sleep mode (22dB), and smartphone app automation.',
      price: 149.00,
      original_price: 189.00,
      category_id: 12,
      stock: 28,
      image_url: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&auto=format&fit=crop&q=80',
      rating: 4.83,
      num_reviews: 47,
      is_featured: 0,
      brand: 'Aura Living'
    },
    {
      id: 77,
      name: 'RoboClean LiDAR Robot Vacuum & Sonic Mop (5000Pa)',
      description: '5000Pa extreme suction, AI 3D obstacle avoidance, automatic carpet boost, auto-empty dust station, and precision multi-floor mapping.',
      price: 429.00,
      original_price: 549.00,
      category_id: 12,
      stock: 12,
      image_url: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800&auto=format&fit=crop&q=80',
      rating: 4.80,
      num_reviews: 42,
      is_featured: 0,
      brand: 'Aura Living'
    },
    {
      id: 78,
      name: 'Smart Ceramic Temperature Control Heated Mug',
      description: 'Maintains coffee or tea at your exact chosen drinking temperature (120°F - 145°F) for up to 3 hours or all day on the charging coaster.',
      price: 119.00,
      original_price: 140.00,
      category_id: 12,
      stock: 35,
      image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
      rating: 4.89,
      num_reviews: 51,
      is_featured: 0,
      brand: 'Aura Living'
    },
    {
      id: 79,
      name: 'Japanese VG-10 Damascus Steel 8-Piece Chef Knife Set with Block',
      description: '67 layers of Japanese VG-10 Damascus steel forged at 60±2 HRC. Razor-sharp 15° edge, ergonomic Pakkawood handles, and magnetic walnut display stand.',
      price: 219.00,
      original_price: 289.00,
      category_id: 12,
      stock: 16,
      image_url: 'https://images.unsplash.com/photo-1593618998160-e34014e67546?w=800&auto=format&fit=crop&q=80',
      rating: 4.95,
      num_reviews: 38,
      is_featured: 0,
      brand: 'ChefCraft'
    }
  ];

  const demoOrders = [
    {
      id: 1,
      order_number: 'ORD-2026-98102',
      user_id: 2,
      total_amount: 1248.99,
      shipping_fee: 0.00,
      discount_amount: 50.00,
      recipient_name: 'John Doe',
      phone: '+1 555-234-5678',
      shipping_address: '123 Tech Street, Apt 4B',
      city: 'San Jose',
      state: 'CA',
      postal_code: '95113',
      payment_method: 'Cash on Delivery',
      payment_status: 'Pending',
      order_status: 'Processing',
      notes: 'Please leave package at the front desk if unavailable.',
      created_at: new Date('2026-03-20T11:20:00Z'),
      updated_at: new Date('2026-03-20T11:20:00Z'),
      items: [
        {
          id: 1,
          product_id: 1,
          product_name: 'ApexPro X1 Ultra 5G Smartphone (256GB Titanium)',
          price: 999.00,
          quantity: 1,
          subtotal: 999.00,
          image_url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80'
        },
        {
          id: 2,
          product_id: 22,
          product_name: 'Apex Pro Quick-Adjustable Dumbbells Set (5-52.5 lbs Pair)',
          price: 329.00,
          quantity: 1,
          subtotal: 329.00,
          image_url: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&auto=format&fit=crop&q=80'
        }
      ]
    },
    {
      id: 2,
      order_number: 'ORD-2026-84391',
      user_id: 3,
      total_amount: 349.00,
      shipping_fee: 0.00,
      discount_amount: 0.00,
      recipient_name: 'Emily Watson',
      phone: '+1 555-876-5432',
      shipping_address: '456 Innovation Blvd',
      city: 'Austin',
      state: 'TX',
      postal_code: '78701',
      payment_method: 'Credit/Debit Card',
      payment_status: 'Paid',
      order_status: 'Shipped',
      notes: 'Gift wrapping requested',
      created_at: new Date('2026-03-18T16:45:00Z'),
      updated_at: new Date('2026-03-19T09:30:00Z'),
      items: [
        {
          id: 3,
          product_id: 16,
          product_name: 'Bespoke Italian Wool 3-Piece Formal Tuxedo Suit',
          price: 349.00,
          quantity: 1,
          subtotal: 349.00,
          image_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&auto=format&fit=crop&q=80'
        }
      ]
    }
  ];

  const reviews = [
    {
      id: 1,
      product_id: 1,
      user_id: 2,
      user_name: 'John Doe',
      rating: 5,
      comment: 'The 200MP camera and 120W charging are astounding. Best smartphone upgrade of the year!',
      created_at: new Date('2026-03-21T10:00:00Z')
    },
    {
      id: 2,
      product_id: 8,
      user_id: 3,
      user_name: 'Emily Watson',
      rating: 5,
      comment: 'Blazing fast rendering speeds and the mini-LED display is breathtaking for video editing.',
      created_at: new Date('2026-03-19T14:20:00Z')
    },
    {
      id: 3,
      product_id: 22,
      user_id: 2,
      user_name: 'John Doe',
      rating: 5,
      comment: 'The adjustable dumbbell set completely replaced my whole gym rack. Super quick weight switching!',
      created_at: new Date('2026-03-22T08:15:00Z')
    },
    {
      id: 4,
      product_id: 29,
      user_id: 3,
      user_name: 'Emily Watson',
      rating: 5,
      comment: 'My golden retriever loves this orthopedic bed! It helped her arthritis immensely.',
      created_at: new Date('2026-03-23T14:00:00Z')
    }
  ];

  return { users, categories, products, demoOrders, reviews };
}

module.exports = { getSeedData };
