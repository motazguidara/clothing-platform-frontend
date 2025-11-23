"use client";

import React from "react";
import Link from "next/link";

export default function AdminDashboard() {
  const [orderStatusFilter, setOrderStatusFilter] = React.useState<"all" | "Processing" | "Shipped" | "Delivered">("all");

  const stats = [
    { label: "Total Products", value: "1,234", change: "+12%", color: "text-green-600" },
    { label: "Total Orders", value: "856", change: "+8%", color: "text-green-600" },
    { label: "Revenue", value: "$45,678", change: "+15%", color: "text-green-600" },
    { label: "Customers", value: "2,345", change: "+5%", color: "text-green-600" },
  ];

  const recentOrders = [
    { id: "ORD-001", customer: "John Doe", amount: "$125.99", status: "Processing", date: "2024-01-15" },
    { id: "ORD-002", customer: "Jane Smith", amount: "$89.50", status: "Shipped", date: "2024-01-15" },
    { id: "ORD-003", customer: "Bob Johnson", amount: "$234.75", status: "Delivered", date: "2024-01-14" },
    { id: "ORD-004", customer: "Alice Brown", amount: "$67.25", status: "Processing", date: "2024-01-14" },
  ];

  const filteredOrders = recentOrders.filter((order) =>
    orderStatusFilter === "all" ? true : order.status === orderStatusFilter
  );

  const lowStockProducts = [
    { name: "Classic T-Shirt", stock: 5, sku: "TSH-001" },
    { name: "Denim Jeans", stock: 3, sku: "JNS-002" },
    { name: "Summer Dress", stock: 2, sku: "DRS-003" },
    { name: "Sneakers", stock: 1, sku: "SNK-004" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center gap-4">
              <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
                ← Back to Store
              </Link>
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Guidance */}
        <div className="bg-blue-50 border border-blue-200 text-blue-900 rounded-lg p-4 mb-6">
          <h2 className="text-sm font-semibold">How to use this dashboard</h2>
          <ul className="mt-2 text-sm space-y-1 list-disc list-inside">
            <li>Stats cards give today’s snapshot; click “View Orders/Products” below to drill into details.</li>
            <li>Use the “Status filter” dropdown in Recent Orders to focus on deliveries in flight.</li>
            <li>Low Stock shows what to restock first; click “Restock” to jump to edit.</li>
            <li>Need a quick action? The tiles below take you directly to the right module.</li>
          </ul>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`text-sm font-medium ${stat.color}`}>
                  {stat.change}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Tip: These are daily rollups; dive into modules for full reports.</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <p className="text-sm text-gray-600 mb-4">Use these shortcuts to jump into common workflows without searching through menus.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/admin/products"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-900">Manage Products</span>
            </Link>
            <Link
              href="/admin/orders"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-900">View Orders</span>
            </Link>
            <Link
              href="/admin/categories"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-900">Categories</span>
            </Link>
            <Link
              href="/admin/customers"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-2">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-900">Customers</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
                <div className="flex items-center gap-3">
                  <label className="text-xs text-gray-600">
                    Status filter
                    <select
                      value={orderStatusFilter}
                      onChange={(e) => setOrderStatusFilter(e.target.value as typeof orderStatusFilter)}
                      className="ml-2 text-xs border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-black"
                    >
                      <option value="all">All</option>
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </label>
                  <Link href="/admin/orders" className="text-sm text-blue-600 hover:text-blue-800">
                    View all
                  </Link>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2">Choose a status to focus on the orders that need your attention now.</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div>
                      <div className="font-medium text-gray-900">{order.id}</div>
                      <div className="text-sm text-gray-600">{order.customer}</div>
                      <div className="text-xs text-gray-500">{order.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{order.amount}</div>
                      <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                        order.status === "Delivered" ? "bg-green-100 text-green-800" :
                        order.status === "Shipped" ? "bg-blue-100 text-blue-800" :
                        "bg-yellow-100 text-yellow-800"
                      }`}>
                        {order.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Low Stock Alert */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Low Stock Alert</h2>
                <Link href="/admin/products?filter=low_stock" className="text-sm text-red-600 hover:text-red-800">
                  View all
                </Link>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {lowStockProducts.map((product) => (
                  <div key={product.sku} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div>
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-600">SKU: {product.sku}</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-medium ${
                        product.stock <= 2 ? "text-red-600" : "text-yellow-600"
                      }`}>
                        {product.stock} left
                      </div>
                      <Link 
                        href={`/admin/products/${product.sku}/edit`}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Restock
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sales Chart Placeholder */}
        <div className="bg-white rounded-lg shadow-sm border mt-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Sales Overview</h2>
          </div>
          <div className="p-6">
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-gray-500">Sales chart would go here</p>
                <p className="text-xs text-gray-400 mt-1">Integration with charting library needed</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
