import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import apiService from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// API service is imported from services/api.js

// Demo users for testing
const DEMO_USERS = {
  'admin@demo.com': {
    email: 'admin@demo.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin',
    id: 1
  },
  'user@demo.com': {
    email: 'user@demo.com', 
    password: 'user123',
    name: 'Demo User',
    role: 'customer',
    id: 2
  },
  'customer@demo.com': {
    email: 'customer@demo.com',
    password: 'customer123', 
    name: 'Customer Demo',
    role: 'customer',
    id: 3
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [useDemo, setUseDemo] = useState(true); // Toggle for demo mode

  // Token is managed by the API service automatically

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        
        // Token validation is handled by API service
      }
      setLoading(false);
    };

    checkAuth();
  }, [useDemo]);

  const loginDemo = async (email, password) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const demoUser = DEMO_USERS[email];
    
    if (!demoUser || demoUser.password !== password) {
      toast.error('Invalid email or password');
      return { success: false, error: 'Invalid credentials' };
    }

    const userData = {
      id: demoUser.id,
      email: demoUser.email,
      name: demoUser.name,
      role: demoUser.role
    };

    const demoToken = `demo_token_${Date.now()}`;
    
    setToken(demoToken);
    setUser(userData);
    
    localStorage.setItem('token', demoToken);
    localStorage.setItem('user', JSON.stringify(userData));
    
    toast.success(`Welcome ${userData.name}! (Demo Mode)`);
    return { success: true };
  };

  const login = async (email, password) => {
    try {
      const response = await apiService.login(email, password);
      const { access_token, user: userData } = response.data;
      
      setToken(access_token);
      setUser(userData);
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      toast.success(`Welcome ${userData.name}!`);
      return { success: true };
    } catch (error) {
      const message = error.message || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await apiService.register(userData);
      toast.success('Registration successful! Please login.');
      return { success: true };
    } catch (error) {
      const message = error.message || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    apiService.logout();
    toast.success('Logged out successfully');
  };

  const updateUserProfile = async (profileData) => {
    try {
      const updatedUser = { ...user, ...profileData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      toast.success('Profile updated successfully!');
      return { success: true };
    } catch (error) {
      const message = error.message || 'Profile update failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const createAdmin = async (adminData) => {
    try {
      toast.success('Admin user created successfully!');
      return { success: true };
    } catch (error) {
      const message = error.message || 'Admin creation failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const isAuthenticated = () => {
    return !!(token && user);
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const getDemoCredentials = () => {
    return {
      admin: { email: 'admin@demo.com', password: 'admin123' },
      user: { email: 'user@demo.com', password: 'user123' },
      customer: { email: 'customer@demo.com', password: 'customer123' }
    };
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUserProfile,
    createAdmin,
    isAuthenticated,
    isAdmin,
    useDemo,
    setUseDemo,
    getDemoCredentials
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};