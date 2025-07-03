import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';

// Layout Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Page Components
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Wishlist from './pages/Wishlist';
import Profile from './pages/Profile';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Admin Components
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCoupons from './pages/admin/AdminCoupons';

// Protected Route Component
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <Router>
            <div className="min-h-screen flex flex-col">
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                }}
              />
              
              <Routes>
                {/* Admin Routes */}
                <Route path="/admin/*" element={
                  <AdminRoute>
                    <AdminLayout>
                      <Routes>
                        <Route index element={<AdminDashboard />} />
                        <Route path="products" element={<AdminProducts />} />
                        <Route path="orders" element={<AdminOrders />} />
                        <Route path="users" element={<AdminUsers />} />
                        <Route path="coupons" element={<AdminCoupons />} />
                      </Routes>
                    </AdminLayout>
                  </AdminRoute>
                } />

                {/* Public Routes */}
                <Route path="/*" element={
                  <>
                    <Navbar />
                    <main className="flex-1">
                      <Routes>
                        <Route index element={<Home />} />
                        <Route path="products" element={<Products />} />
                        <Route path="products/:id" element={<ProductDetail />} />
                        <Route path="login" element={<Login />} />
                        <Route path="register" element={<Register />} />
                        
                        {/* Protected Routes */}
                        <Route path="cart" element={
                          <ProtectedRoute>
                            <Cart />
                          </ProtectedRoute>
                        } />
                        <Route path="checkout" element={
                          <ProtectedRoute>
                            <Checkout />
                          </ProtectedRoute>
                        } />
                        <Route path="orders" element={
                          <ProtectedRoute>
                            <Orders />
                          </ProtectedRoute>
                        } />
                        <Route path="orders/:id" element={
                          <ProtectedRoute>
                            <OrderDetail />
                          </ProtectedRoute>
                        } />
                        <Route path="wishlist" element={
                          <ProtectedRoute>
                            <Wishlist />
                          </ProtectedRoute>
                        } />
                        <Route path="profile" element={
                          <ProtectedRoute>
                            <Profile />
                          </ProtectedRoute>
                        } />
                      </Routes>
                    </main>
                    <Footer />
                  </>
                } />
              </Routes>
            </div>
          </Router>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
