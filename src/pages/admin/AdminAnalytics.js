import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  UsersIcon,
  EyeIcon,
  CalendarDaysIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';

const AdminAnalytics = () => {
  const [timeframe, setTimeframe] = useState('7d');
  const [analyticsData, setAnalyticsData] = useState({});
  const [loading, setLoading] = useState(false);

  // Demo analytics data
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const demoData = {
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
        },
        topProducts: [
          { name: 'iPhone 15 Pro', revenue: 244500, orders: 245, growth: 18.5 },
          { name: 'MacBook Air M2', revenue: 107800, orders: 89, growth: 12.3 },
          { name: 'Premium T-Shirt', revenue: 12960, orders: 432, growth: -5.2 },
          { name: 'Wireless Headphones', revenue: 31200, orders: 156, growth: 8.7 },
          { name: 'JavaScript Guide', revenue: 8350, orders: 167, growth: 22.1 }
        ],
        categoryPerformance: [
          { name: 'Electronics', revenue: 383500, percentage: 72.5, growth: 15.3 },
          { name: 'Clothing', revenue: 89460, percentage: 16.9, growth: -2.1 },
          { name: 'Books', revenue: 41850, percentage: 7.9, growth: 28.4 },
          { name: 'Home', revenue: 14190, percentage: 2.7, growth: 5.8 }
        ],
        userAcquisition: {
          organic: 45,
          social: 25,
          paid: 20,
          referral: 10
        },
        recentActivity: [
          { type: 'order', description: 'New order #ORD-123 placed', time: '2 min ago', amount: '$299.99' },
          { type: 'user', description: 'New user registration', time: '5 min ago', amount: null },
          { type: 'order', description: 'Order #ORD-120 shipped', time: '12 min ago', amount: '$149.99' },
          { type: 'return', description: 'Return request #RET-15', time: '25 min ago', amount: '$75.25' },
          { type: 'order', description: 'Order #ORD-118 completed', time: '1 hr ago', amount: '$189.99' }
        ]
      };
      setAnalyticsData(demoData);
      setLoading(false);
    }, 500);
  }, [timeframe]);

  const MetricCard = ({ title, value, growth, icon: Icon, color, prefix = '', suffix = '' }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{prefix}{value}{suffix}</p>
        </div>
        <div className={`p-3 rounded-md ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      <div className="mt-4 flex items-center">
        <div className={`flex items-center text-sm ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {growth >= 0 ? (
            <TrendingUpIcon className="h-4 w-4 mr-1" />
          ) : (
            <TrendingDownIcon className="h-4 w-4 mr-1" />
          )}
          {Math.abs(growth)}%
        </div>
        <span className="text-sm text-gray-500 ml-2">vs last period</span>
      </div>
    </div>
  );

  const SimpleBarChart = ({ data, labels, title }) => {
    const maxValue = Math.max(...data);
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="space-y-3">
          {labels.map((label, index) => (
            <div key={label} className="flex items-center">
              <div className="w-12 text-sm text-gray-600">{label}</div>
              <div className="flex-1 mx-3">
                <div className="bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-blue-500 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${(data[index] / maxValue) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="w-16 text-sm text-gray-900 text-right">
                ${data[index].toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const DonutChart = ({ data, title }) => {
    const total = Object.values(data).reduce((sum, value) => sum + value, 0);
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center">
          <div className="relative w-32 h-32">
            <svg viewBox="0 0 42 42" className="w-32 h-32">
              <circle
                cx="21"
                cy="21"
                r="15.915"
                fill="transparent"
                stroke="#E5E7EB"
                strokeWidth="3"
              />
              {Object.entries(data).map(([key, value], index) => {
                const percentage = (value / total) * 100;
                const strokeDasharray = `${percentage} ${100 - percentage}`;
                const rotation = Object.entries(data)
                  .slice(0, index)
                  .reduce((acc, [, val]) => acc + (val / total) * 100, 0);
                
                return (
                  <circle
                    key={key}
                    cx="21"
                    cy="21"
                    r="15.915"
                    fill="transparent"
                    stroke={colors[index]}
                    strokeWidth="3"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset="25"
                    transform={`rotate(${rotation * 3.6 - 90} 21 21)`}
                  />
                );
              })}
            </svg>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {Object.entries(data).map(([key, value], index) => (
            <div key={key} className="flex items-center text-sm">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: colors[index] }}
              ></div>
              <span className="text-gray-600 flex-1 capitalize">{key}</span>
              <span className="font-medium">{value}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600">Track your business performance and insights</p>
            </div>
            <div className="flex space-x-3">
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Revenue"
            value={analyticsData.overview?.totalRevenue?.toLocaleString()}
            growth={analyticsData.overview?.revenueGrowth}
            icon={CurrencyDollarIcon}
            color="bg-green-500"
            prefix="$"
          />
          <MetricCard
            title="Total Orders"
            value={analyticsData.overview?.totalOrders?.toLocaleString()}
            growth={analyticsData.overview?.ordersGrowth}
            icon={ShoppingBagIcon}
            color="bg-blue-500"
          />
          <MetricCard
            title="Total Users"
            value={analyticsData.overview?.totalUsers?.toLocaleString()}
            growth={analyticsData.overview?.usersGrowth}
            icon={UsersIcon}
            color="bg-purple-500"
          />
          <MetricCard
            title="Conversion Rate"
            value={analyticsData.overview?.conversionRate}
            growth={analyticsData.overview?.conversionGrowth}
            icon={TrendingUpIcon}
            color="bg-orange-500"
            suffix="%"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Sales Chart */}
          <SimpleBarChart
            data={analyticsData.salesChart?.data || []}
            labels={analyticsData.salesChart?.labels || []}
            title="Daily Sales"
          />

          {/* Order Status Distribution */}
          <DonutChart
            data={analyticsData.orderStatusChart || {}}
            title="Order Status Distribution"
          />
        </div>

        {/* Performance Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Products */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {analyticsData.topProducts?.map((product, index) => (
                  <div key={product.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-sm font-medium text-gray-500">#{index + 1}</div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.orders} orders</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        ${product.revenue.toLocaleString()}
                      </div>
                      <div className={`text-sm flex items-center ${product.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {product.growth >= 0 ? (
                          <ArrowUpIcon className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowDownIcon className="h-3 w-3 mr-1" />
                        )}
                        {Math.abs(product.growth)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Category Performance */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Category Performance</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {analyticsData.categoryPerformance?.map((category) => (
                  <div key={category.name} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900">{category.name}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{category.percentage}%</span>
                        <div className={`text-sm flex items-center ${category.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {category.growth >= 0 ? (
                            <ArrowUpIcon className="h-3 w-3 mr-1" />
                          ) : (
                            <ArrowDownIcon className="h-3 w-3 mr-1" />
                          )}
                          {Math.abs(category.growth)}%
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${category.percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-sm text-gray-600">
                      ${category.revenue.toLocaleString()} revenue
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Acquisition */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">User Acquisition Channels</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {Object.entries(analyticsData.userAcquisition || {}).map(([channel, percentage]) => (
                  <div key={channel} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 capitalize">{channel}</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-8 text-right">{percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {analyticsData.recentActivity?.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.type === 'order' ? 'bg-blue-100' :
                      activity.type === 'user' ? 'bg-green-100' :
                      activity.type === 'return' ? 'bg-red-100' : 'bg-gray-100'
                    }`}>
                      {activity.type === 'order' && <ShoppingBagIcon className="h-4 w-4 text-blue-600" />}
                      {activity.type === 'user' && <UsersIcon className="h-4 w-4 text-green-600" />}
                      {activity.type === 'return' && <ArrowDownIcon className="h-4 w-4 text-red-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <p className="text-sm text-gray-500">{activity.time}</p>
                    </div>
                    {activity.amount && (
                      <div className="text-sm font-medium text-gray-900">{activity.amount}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;