import axios from 'axios';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
const USE_DEMO_MODE = process.env.REACT_APP_DEMO_MODE !== 'false'; // Default to demo mode

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Demo Data (fallback when backend is not available)
const demoData = {
  users: [
    {
      id: 1,
      name: 'Admin User',
      email: 'admin@demo.com',
      role: 'admin',
      status: 'active',
      phone: '+1-555-0100',
      joinedDate: '2024-01-01',
      lastLogin: '2024-01-15',
      totalOrders: 0,
      totalSpent: 0.00,
      address: {
        street: '123 Admin St',
        city: 'Admin City',
        state: 'AC',
        zipCode: '12345',
        country: 'USA'
      }
    },
    {
      id: 2,
      name: 'John Doe',
      email: 'user@demo.com',
      role: 'customer',
      status: 'active',
      phone: '+1-555-0123',
      joinedDate: '2024-01-05',
      lastLogin: '2024-01-15',
      totalOrders: 3,
      totalSpent: 567.45,
      address: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA'
      }
    },
    {
      id: 3,
      name: 'Jane Smith',
      email: 'customer@demo.com',
      role: 'customer',
      status: 'active',
      phone: '+1-555-0124',
      joinedDate: '2024-01-08',
      lastLogin: '2024-01-14',
      totalOrders: 5,
      totalSpent: 892.30,
      address: {
        street: '456 Oak Ave',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90210',
        country: 'USA'
      }
    }
  ],
  products: [
    {
      id: 1,
      name: 'iPhone 15 Pro',
      category: 'Electronics',
      price: 999.99,
      stock: 45,
      sales: 245,
      image: '/api/placeholder/200/200',
      status: 'active',
      created: '2024-01-01',
      description: 'Latest iPhone with amazing features'
    },
    {
      id: 2,
      name: 'MacBook Air M2',
      category: 'Electronics',
      price: 1199.99,
      stock: 23,
      sales: 89,
      image: '/api/placeholder/200/200',
      status: 'active',
      created: '2024-01-02',
      description: 'Powerful laptop for professionals'
    },
    {
      id: 3,
      name: 'Premium T-Shirt',
      category: 'Clothing',
      price: 29.99,
      stock: 150,
      sales: 432,
      image: '/api/placeholder/200/200',
      status: 'active',
      created: '2024-01-03',
      description: 'Comfortable premium cotton t-shirt'
    }
  ],
  orders: [
    {
      id: 'ORD-001',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      customerPhone: '+1-555-0123',
      status: 'completed',
      total: 149.99,
      items: [
        { name: 'iPhone 15 Pro', quantity: 1, price: 999.99 },
        { name: 'Premium T-Shirt', quantity: 2, price: 29.99 }
      ],
      shippingAddress: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA'
      },
      orderDate: '2024-01-15',
      shippedDate: '2024-01-16',
      deliveredDate: '2024-01-18',
      paymentMethod: 'Credit Card',
      shippingCost: 9.99,
      tax: 12.00
    }
  ]
};

// Utility function to simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to check if backend is available
const checkBackendHealth = async () => {
  try {
    await api.get('/health', { timeout: 3000 });
    return true;
  } catch (error) {
    console.log('Backend not available, using demo mode');
    return false;
  }
};

// API Service Class
class ApiService {
  constructor() {
    this.backendAvailable = false;
    this.checkBackend();
  }

  async checkBackend() {
    this.backendAvailable = await checkBackendHealth();
  }

  // Authentication
  async login(email, password) {
    if (USE_DEMO_MODE || !this.backendAvailable) {
      await delay(800); // Simulate API delay
      
      // Demo authentication
      const demoCredentials = {
        'admin@demo.com': { password: 'admin123', user: demoData.users.find(u => u.email === 'admin@demo.com') },
        'user@demo.com': { password: 'user123', user: demoData.users.find(u => u.email === 'user@demo.com') },
        'customer@demo.com': { password: 'customer123', user: demoData.users.find(u => u.email === 'customer@demo.com') }
      };

      const credential = demoCredentials[email];
      if (credential && credential.password === password) {
        const token = 'demo-token-' + Date.now();
        localStorage.setItem('authToken', token);
        return {
          data: {
            access_token: token,
            token_type: 'bearer',
            user: credential.user
          }
        };
      } else {
        throw new Error('Invalid credentials');
      }
    }

    try {
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('authToken', response.data.access_token);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async register(userData) {
    if (USE_DEMO_MODE || !this.backendAvailable) {
      await delay(800);
      const newUser = {
        id: Date.now(),
        ...userData,
        role: 'customer',
        status: 'active',
        joinedDate: new Date().toISOString().split('T')[0],
        totalOrders: 0,
        totalSpent: 0.00
      };
      demoData.users.push(newUser);
      return { data: { user: newUser } };
    }

    return api.post('/auth/register', userData);
  }

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  // Products
  async getProducts(params = {}) {
    if (USE_DEMO_MODE || !this.backendAvailable) {
      await delay(500);
      let products = [...demoData.products];
      
      // Apply filters for demo
      if (params.category && params.category !== 'all') {
        products = products.filter(p => p.category === params.category);
      }
      if (params.search) {
        products = products.filter(p => 
          p.name.toLowerCase().includes(params.search.toLowerCase()) ||
          p.description.toLowerCase().includes(params.search.toLowerCase())
        );
      }
      
      return { data: products };
    }

    return api.get('/products', { params });
  }

  async getProduct(id) {
    if (USE_DEMO_MODE || !this.backendAvailable) {
      await delay(300);
      const product = demoData.products.find(p => p.id == id);
      if (!product) throw new Error('Product not found');
      return { data: product };
    }

    return api.get(`/products/${id}`);
  }

  async createProduct(productData) {
    if (USE_DEMO_MODE || !this.backendAvailable) {
      await delay(800);
      const newProduct = {
        id: Date.now(),
        ...productData,
        sales: 0,
        created: new Date().toISOString().split('T')[0]
      };
      demoData.products.push(newProduct);
      return { data: newProduct };
    }

    return api.post('/admin/products', productData);
  }

  async updateProduct(id, productData) {
    if (USE_DEMO_MODE || !this.backendAvailable) {
      await delay(800);
      const index = demoData.products.findIndex(p => p.id == id);
      if (index === -1) throw new Error('Product not found');
      demoData.products[index] = { ...demoData.products[index], ...productData };
      return { data: demoData.products[index] };
    }

    return api.put(`/admin/products/${id}`, productData);
  }

  async deleteProduct(id) {
    if (USE_DEMO_MODE || !this.backendAvailable) {
      await delay(500);
      const index = demoData.products.findIndex(p => p.id == id);
      if (index === -1) throw new Error('Product not found');
      demoData.products.splice(index, 1);
      return { data: { message: 'Product deleted' } };
    }

    return api.delete(`/admin/products/${id}`);
  }

  // Orders
  async getOrders(params = {}) {
    if (USE_DEMO_MODE || !this.backendAvailable) {
      await delay(500);
      let orders = [...demoData.orders];
      
      // Apply filters
      if (params.status && params.status !== 'all') {
        orders = orders.filter(o => o.status === params.status);
      }
      
      return { data: orders };
    }

    return api.get('/admin/orders', { params });
  }

  async updateOrderStatus(orderId, status) {
    if (USE_DEMO_MODE || !this.backendAvailable) {
      await delay(500);
      const order = demoData.orders.find(o => o.id === orderId);
      if (order) {
        order.status = status;
        return { data: order };
      }
      throw new Error('Order not found');
    }

    return api.patch(`/admin/orders/${orderId}/status`, { status });
  }

  // Users
  async getUsers(params = {}) {
    if (USE_DEMO_MODE || !this.backendAvailable) {
      await delay(500);
      let users = [...demoData.users];
      
      // Apply filters
      if (params.role && params.role !== 'all') {
        users = users.filter(u => u.role === params.role);
      }
      if (params.status && params.status !== 'all') {
        users = users.filter(u => u.status === params.status);
      }
      
      return { data: users };
    }

    return api.get('/admin/users', { params });
  }

  async updateUser(id, userData) {
    if (USE_DEMO_MODE || !this.backendAvailable) {
      await delay(500);
      const index = demoData.users.findIndex(u => u.id == id);
      if (index === -1) throw new Error('User not found');
      demoData.users[index] = { ...demoData.users[index], ...userData };
      return { data: demoData.users[index] };
    }

    return api.put(`/admin/users/${id}`, userData);
  }

  async deleteUser(id) {
    if (USE_DEMO_MODE || !this.backendAvailable) {
      await delay(500);
      const index = demoData.users.findIndex(u => u.id == id);
      if (index === -1) throw new Error('User not found');
      demoData.users.splice(index, 1);
      return { data: { message: 'User deleted' } };
    }

    return api.delete(`/admin/users/${id}`);
  }

  // Analytics
  async getAnalytics(timeframe = '7d') {
    if (USE_DEMO_MODE || !this.backendAvailable) {
      await delay(800);
      return {
        data: {
          overview: {
            totalRevenue: 125430.50,
            totalOrders: 1247,
            totalUsers: 3456,
            conversionRate: 3.4,
            revenueGrowth: 12.5,
            ordersGrowth: 8.3,
            usersGrowth: 15.2,
            conversionGrowth: -2.1
          },
          salesChart: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            data: [12000, 15000, 18000, 14000, 22000, 25000, 28000]
          },
          orderStatusChart: {
            completed: 68,
            processing: 15,
            shipped: 12,
            pending: 3,
            cancelled: 2
          }
        }
      };
    }

    return api.get(`/admin/analytics?timeframe=${timeframe}`);
  }

  // Dashboard stats
  async getDashboardStats() {
    if (USE_DEMO_MODE || !this.backendAvailable) {
      await delay(500);
      return {
        data: {
          totalRevenue: 125430.50,
          totalOrders: 1247,
          totalUsers: 3456,
          totalProducts: 156,
          revenueGrowth: 12.5,
          ordersGrowth: 8.3,
          usersGrowth: 15.2,
          productsGrowth: 4.1
        }
      };
    }

    return api.get('/admin/dashboard/stats');
  }
}

// Create and export API service instance
const apiService = new ApiService();

export default apiService;