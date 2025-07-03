import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  // Fetch cart data when user is authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      fetchCart();
    } else {
      setCart(null);
    }
  }, [isAuthenticated]);

  const fetchCart = async () => {
    if (!isAuthenticated()) return;
    
    try {
      setLoading(true);
      const response = await axios.get('/cart/');
      setCart(response.data);
    } catch (error) {
      console.error('Error fetching cart:', error);
      // If cart doesn't exist, it will be created on first add
      setCart({ items: [], total_amount: 0 });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    if (!isAuthenticated()) {
      toast.error('Please login to add items to cart');
      return { success: false };
    }

    try {
      setLoading(true);
      const response = await axios.post('/cart/add', {
        product_id: productId,
        quantity
      });
      
      setCart(response.data.data.cart);
      toast.success('Item added to cart!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to add item to cart';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const updateCartItem = async (productId, quantity) => {
    if (!isAuthenticated()) return { success: false };

    try {
      setLoading(true);
      const response = await axios.put(`/cart/update/${productId}?quantity=${quantity}`);
      setCart(response.data.data.cart);
      toast.success('Cart updated!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to update cart';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (productId) => {
    if (!isAuthenticated()) return { success: false };

    try {
      setLoading(true);
      const response = await axios.delete(`/cart/remove/${productId}`);
      setCart(response.data.data.cart);
      toast.success('Item removed from cart!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to remove item';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated()) return { success: false };

    try {
      setLoading(true);
      const response = await axios.delete('/cart/clear');
      setCart(response.data.data.cart);
      toast.success('Cart cleared!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to clear cart';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const getCartItemCount = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  };

  const getCartTotal = () => {
    return cart?.total_amount || 0;
  };

  const isInCart = (productId) => {
    if (!cart || !cart.items) return false;
    return cart.items.some(item => item.product_id === productId);
  };

  const getCartItemQuantity = (productId) => {
    if (!cart || !cart.items) return 0;
    const item = cart.items.find(item => item.product_id === productId);
    return item ? item.quantity : 0;
  };

  const value = {
    cart,
    loading,
    fetchCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartItemCount,
    getCartTotal,
    isInCart,
    getCartItemQuantity
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};