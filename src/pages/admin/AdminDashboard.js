import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../../services/api';
import {
  ChartBarIcon,
  UsersIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon as TrendingUpIcon,
  ArrowTrendingDownIcon as TrendingDownIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
    revenueGrowth: 0,
    ordersGrowth: 0,
    usersGrowth: 0,
    productsGrowth: 0
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);

  // Demo data - replace with real API calls when backend is ready
  useEffect(() => {
    // Simulate loading demo data
    setTimeout(() => {
      setStats({
        totalRevenue: 125430.50,
        totalOrders: 1247,
        totalUsers: 3456,
        totalProducts: 156,
        revenueGrowth: 12.5,
        ordersGrowth: 8.3,
        usersGrowth: 15.2,
        productsGrowth: 4.1
      });

      setRecentOrders([
        { id: 'ORD-001', customer: 'John Doe', amount: 149.99, status: 'completed', date: '2024-01-15' },
        { id: 'ORD-002', customer: 'Jane Smith', amount: 89.50, status: 'processing', date: '2024-01-15' },
        { id: 'ORD-003', customer: 'Mike Johnson', amount: 299.99, status: 'shipped', date: '2024-01-14' },
        { id: 'ORD-004', customer: 'Sarah Wilson', amount: 75.25, status: 'pending', date: '2024-01-14' },
        { id: 'ORD-005', customer: 'Tom Brown', amount: 199.99, status: 'completed', date: '2024-01-13' }
      ]);

      setTopProducts([
        { id: 1, name: 'iPhone 15 Pro', sales: 245, revenue: 244500, image: '/api/placeholder/60/60' },
        { id: 2, name: 'MacBook Air M2', sales: 89, revenue: 107800, image: '/api/placeholder/60/60' },
        { id: 3, name: 'Premium T-Shirt', sales: 432, revenue: 12960, image: '/api/placeholder/60/60' },
        { id: 4, name: 'JavaScript Guide', sales: 167, revenue: 8350, image: '/api/placeholder/60/60' },
        { id: 5, name: 'Coffee Mug', sales: 298, revenue: 7450, image: '/api/placeholder/60/60' }
      ]);

      setRecentUsers([
        { id: 1, name: 'Alice Cooper', email: 'alice@example.com', joined: '2024-01-15', orders: 3 },
        { id: 2, name: 'Bob Miller', email: 'bob@example.com', joined: '2024-01-14', orders: 1 },
        { id: 3, name: 'Carol Davis', email: 'carol@example.com', joined: '2024-01-14', orders: 5 },
        { id: 4, name: 'David Lee', email: 'david@example.com', joined: '2024-01-13', orders: 2 },
        { id: 5, name: 'Eva Green', email: 'eva@example.com', joined: '2024-01-12', orders: 4 }
      ]);
    }, 500);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const StatCard = ({ title, value, growth, icon: Icon, color }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-md ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-semibold text-gray-900">{value}</p>
            </div>
            <div className={`flex items-center text-sm ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {growth >= 0 ? (
                <TrendingUpIcon className="h-4 w-4 mr-1" />
              ) : (
                <TrendingDownIcon className="h-4 w-4 mr-1" />
              )}
              {Math.abs(growth)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with your store.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Revenue"
            value={`$${stats.totalRevenue.toLocaleString()}`}
            growth={stats.revenueGrowth}
            icon={CurrencyDollarIcon}
            color="bg-green-500"
          />
          <StatCard
            title="Total Orders"
            value={stats.totalOrders.toLocaleString()}
            growth={stats.ordersGrowth}
            icon={ShoppingBagIcon}
            color="bg-blue-500"
          />
          <StatCard
            title="Total Users"
            value={stats.totalUsers.toLocaleString()}
            growth={stats.usersGrowth}
            icon={UsersIcon}
            color="bg-purple-500"
          />
          <StatCard
            title="Total Products"
            value={stats.totalProducts.toLocaleString()}
            growth={stats.productsGrowth}
            icon={ChartBarIcon}
            color="bg-orange-500"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link
            to="/admin/products"
            className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow text-center"
          >
            <ShoppingBagIcon className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">Manage Products</h3>
            <p className="text-sm text-gray-600">Add, edit, or remove products</p>
          </Link>
          <Link
            to="/admin/orders"
            className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow text-center"
          >
            <ChartBarIcon className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">View Orders</h3>
            <p className="text-sm text-gray-600">Manage customer orders</p>
          </Link>
          <Link
            to="/admin/users"
            className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow text-center"
          >
            <UsersIcon className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">User Management</h3>
            <p className="text-sm text-gray-600">Manage user accounts</p>
          </Link>
          <Link
            to="/admin/analytics"
            className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow text-center"
          >
            <ChartBarIcon className="h-8 w-8 text-orange-500 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">Analytics</h3>
            <p className="text-sm text-gray-600">View detailed reports</p>
          </Link>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
            </div>
            <div className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.customer}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${order.amount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200">
              <Link
                to="/admin/orders"
                className="text-blue-600 hover:text-blue-500 text-sm font-medium"
              >
                View all orders →
              </Link>
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Top Products</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {topProducts.map((product) => (
                  <div key={product.id} className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                      <ShoppingBagIcon className="h-6 w-6 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {product.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {product.sales} sales • ${product.revenue.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-gray-400 hover:text-gray-600">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button className="text-gray-400 hover:text-gray-600">
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200">
              <Link
                to="/admin/products"
                className="text-blue-600 hover:text-blue-500 text-sm font-medium"
              >
                View all products →
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Users */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Users</h2>
          </div>
          <div className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.joined}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.orders}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-500">
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-500">
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-500">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-gray-200">
            <Link
              to="/admin/users"
              className="text-blue-600 hover:text-blue-500 text-sm font-medium"
            >
              View all users →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;