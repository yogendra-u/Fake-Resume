import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL;

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

  // Set up axios interceptor for token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
        
        if (!useDemo) {
          try {
            // Verify token is still valid with real backend
            const response = await axios.get('/auth/me');
            setUser(response.data);
          } catch (error) {
            // Token is invalid, clear everything
            logout();
          }
        }
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

  const loginReal = async (email, password) => {
    try {
      const response = await axios.post('/auth/login', {
        email,
        password
      });

      const { access_token, user: userData } = response.data;
      
      setToken(access_token);
      setUser(userData);
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.detail || 'Login failed. Using demo mode.';
      toast.error(message);
      
      // Fallback to demo mode if backend is not available
      setUseDemo(true);
      return await loginDemo(email, password);
    }
  };

  const login = async (email, password) => {
    if (useDemo) {
      return await loginDemo(email, password);
    } else {
      return await loginReal(email, password);
    }
  };

  const register = async (userData) => {
    if (useDemo) {
      // Demo registration
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('Registration successful! Please login with demo credentials.');
      return { success: true };
    }

    try {
      const response = await axios.post('/auth/register', userData);
      toast.success('Registration successful! Please login.');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.detail || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    toast.success('Logged out successfully');
  };

  const updateUserProfile = async (profileData) => {
    if (useDemo) {
      // Demo profile update
      await new Promise(resolve => setTimeout(resolve, 500));
      const updatedUser = { ...user, ...profileData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      toast.success('Profile updated successfully! (Demo Mode)');
      return { success: true };
    }

    try {
      const response = await axios.put('/users/profile', profileData);
      const updatedUser = response.data.data.user;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      toast.success('Profile updated successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.detail || 'Profile update failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const createAdmin = async (adminData) => {
    if (useDemo) {
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('Admin user created successfully! (Demo Mode)');
      return { success: true };
    }

    try {
      const response = await axios.post('/auth/create-admin', adminData);
      toast.success('Admin user created successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.detail || 'Admin creation failed';
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