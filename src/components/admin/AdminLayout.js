import React from 'react';

const AdminLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        <div className="w-64 bg-white shadow-sm">
          <div className="p-4">
            <h2 className="text-xl font-bold text-gray-900">Admin Panel</h2>
          </div>
        </div>
        <div className="flex-1 p-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;