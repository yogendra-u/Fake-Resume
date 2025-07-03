// MongoDB initialization script
db = db.getSiblingDB('ecommerce');

// Create collections with initial data
db.createCollection('users');
db.createCollection('products');
db.createCollection('orders');
db.createCollection('carts');
db.createCollection('coupons');
db.createCollection('wishlists');

// Insert sample products
db.products.insertMany([
  {
    name: "iPhone 14 Pro",
    description: "Latest iPhone with Pro camera system",
    category: "electronics",
    price: 999.99,
    stock_quantity: 50,
    images: ["https://via.placeholder.com/400x400?text=iPhone+14+Pro"],
    tags: ["smartphone", "apple", "mobile"],
    is_active: true,
    discount_percentage: 0,
    rating: 4.5,
    review_count: 128,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    name: "MacBook Pro M2",
    description: "Powerful laptop with M2 chip",
    category: "electronics",
    price: 1299.99,
    stock_quantity: 25,
    images: ["https://via.placeholder.com/400x400?text=MacBook+Pro"],
    tags: ["laptop", "apple", "computer"],
    is_active: true,
    discount_percentage: 10,
    rating: 4.8,
    review_count: 89,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    name: "Classic T-Shirt",
    description: "Comfortable cotton t-shirt",
    category: "clothing",
    price: 29.99,
    stock_quantity: 100,
    images: ["https://via.placeholder.com/400x400?text=T-Shirt"],
    tags: ["shirt", "cotton", "casual"],
    is_active: true,
    discount_percentage: 0,
    rating: 4.2,
    review_count: 45,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    name: "JavaScript: The Complete Guide",
    description: "Comprehensive guide to JavaScript programming",
    category: "books",
    price: 49.99,
    stock_quantity: 75,
    images: ["https://via.placeholder.com/400x400?text=JS+Book"],
    tags: ["book", "programming", "javascript"],
    is_active: true,
    discount_percentage: 15,
    rating: 4.6,
    review_count: 67,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    name: "Coffee Mug",
    description: "Ceramic coffee mug - 12oz",
    category: "home",
    price: 19.99,
    stock_quantity: 200,
    images: ["https://via.placeholder.com/400x400?text=Coffee+Mug"],
    tags: ["mug", "coffee", "ceramic"],
    is_active: true,
    discount_percentage: 0,
    rating: 4.0,
    review_count: 23,
    created_at: new Date(),
    updated_at: new Date()
  }
]);

// Insert sample coupons
db.coupons.insertMany([
  {
    code: "WELCOME10",
    description: "Welcome discount for new customers",
    coupon_type: "percentage",
    value: 10,
    min_order_amount: 50,
    max_discount_amount: 20,
    usage_limit: 100,
    used_count: 0,
    expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    is_active: true,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    code: "SAVE25",
    description: "$25 off on orders over $100",
    coupon_type: "fixed_amount",
    value: 25,
    min_order_amount: 100,
    max_discount_amount: null,
    usage_limit: 50,
    used_count: 0,
    expiry_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
    is_active: true,
    created_at: new Date(),
    updated_at: new Date()
  }
]);

print('Sample data inserted successfully!');