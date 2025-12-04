import React from "react";
import Link from "next/link";
import { ClientOnly } from "./ClientOnly";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Clothing Platform</h3>
            <p className="text-gray-400 text-sm mb-4">
              Everyday staples and standout looks for men, women, and kids. Designed for comfort, built to last.
            </p>
            <div className="space-y-1 text-sm text-gray-400">
              <div>support@clothing-platform.com</div>
              <div>+216 20 000 000</div>
              <div>123 Fashion Ave, Tunis</div>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Shop</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/men" className="text-gray-400 hover:text-white transition-colors">Men</Link></li>
              <li><Link href="/women" className="text-gray-400 hover:text-white transition-colors">Women</Link></li>
              <li><Link href="/kids" className="text-gray-400 hover:text-white transition-colors">Kids</Link></li>
              <li><Link href="/catalog?sale=true" className="text-gray-400 hover:text-white transition-colors">Sale</Link></li>
              <li><Link href="/catalog" className="text-gray-400 hover:text-white transition-colors">All Products</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Customer Service</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/size-guide" className="text-gray-400 hover:text-white transition-colors">Size Guide</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-lg font-semibold mb-4">My Account</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/profile" className="text-gray-400 hover:text-white transition-colors">Profile</Link></li>
              <li><Link href="/orders" className="text-gray-400 hover:text-white transition-colors">Orders</Link></li>
              <li><Link href="/wishlist" className="text-gray-400 hover:text-white transition-colors">Wishlist</Link></li>
              <li><Link href="/cart" className="text-gray-400 hover:text-white transition-colors">Cart</Link></li>
              <li><Link href="/login" className="text-gray-400 hover:text-white transition-colors">Sign In</Link></li>
            </ul>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <ClientOnly>
            <div className="max-w-md" suppressHydrationWarning>
              <h3 className="text-lg font-semibold mb-2">Stay in the loop</h3>
              <p className="text-gray-400 text-sm mb-4">
                Subscribe for product drops, style tips, and exclusive offers.
              </p>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-l-md focus:outline-none focus:ring-2 focus:ring-white text-white placeholder-gray-400"
                />
                <button className="px-6 py-2 bg-white text-gray-900 rounded-r-md hover:bg-gray-100 transition-colors font-medium">
                  Subscribe
                </button>
              </div>
            </div>
          </ClientOnly>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-gray-400 mb-4 md:mb-0">
            © 2024 Clothing Platform. All rights reserved.
          </div>
          <div className="flex space-x-6 text-sm">
            <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms</Link>
            <Link href="/cookies" className="text-gray-400 hover:text-white transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
