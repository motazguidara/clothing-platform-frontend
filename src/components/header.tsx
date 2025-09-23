"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import WishlistIcon from "@/components/WishlistIcon";
import { useCart } from "@/hooks/useCart";
import { useWishlistIds } from "@/hooks/useWishlist";
import { useUIStore } from "@/store/ui";

export default function Header() {
  const [scrolled, setScrolled] = React.useState(false);
  const openCart = useUIStore((s) => s.openCart);
  const { data: cart } = useCart();
  const cartCount = (cart?.items ?? []).reduce((sum: number, it: any) => sum + (it.quantity || 1), 0);
  const { data: wishlist } = useWishlistIds();
  const wishCount = (wishlist?.ids ?? []).length;
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 16);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Prevent hydration mismatches by deferring dynamic counts until after mount
  React.useEffect(() => setMounted(true), []);
  const displayWishCount = mounted ? wishCount : 0;
  const displayCartCount = mounted ? cartCount : 0;

  return (
    <header className={`fixed inset-x-0 top-0 z-40 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-border ${scrolled ? "h-14" : "h-20"} transition-[height,background-color] duration-300`}>
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold tracking-tight uppercase">Clothing</Link>
          <nav className="hidden md:flex items-center gap-6 text-sm" aria-label="Main navigation">
            <Link href="/men" className="hover:opacity-80">Men</Link>
            <Link href="/women" className="hover:opacity-80">Women</Link>
            <Link href="/kids" className="hover:opacity-80">Kids</Link>
            <Link href="/catalog?sale=true" className="hover:opacity-80">Sale</Link>
            <Link href="/catalog" className="hover:opacity-80">All Products</Link>
          </nav>
        </div>

        <div className="flex items-center gap-3 w-full justify-end">
          {/* Centered search pill */}
          <div className="hidden md:flex flex-1 justify-center">
            <Link
              href="/search"
              className="w-full max-w-xl rounded-full bg-gray-100 shadow-inner px-4 py-2 flex items-center gap-2 text-sm hover:bg-gray-200 focus-visible:ring-2 ring-offset-2 ring-black"
              aria-label="Open search"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" className="stroke-gray-500" fill="none" strokeWidth="1.5" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="currentColor" />
                <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeLinecap="round" />
              </svg>
              <span className="text-gray-600">Search</span>
            </Link>
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-2">
            <Link href="/login" className="px-3 py-2 rounded-md hover:bg-secondary/50 text-sm hidden md:block">Login</Link>
            <Link href="/profile" aria-label="Profile" className="px-3 py-2 rounded-md hover:bg-secondary/50 text-sm hidden md:block">Profile</Link>

            <WishlistIcon count={displayWishCount} onClick={() => (window.location.href = "/wishlist")} tooltip="Wishlist" />

            <div className="relative">
              <IconButton onClick={openCart} aria-label="Open cart" tooltip="Cart">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" className="stroke-black/80" aria-hidden="true">
                  <path d="M6 6h15l-1.5 9h-12z" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="9" cy="20" r="1.5" />
                  <circle cx="18" cy="20" r="1.5" />
                </svg>
              </IconButton>
              {displayCartCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-black text-white font-bold text-[10px] border border-white">{displayCartCount}</span>
              )}
            </div>

            {/* Mobile search trigger */}
            <Link
              href="/search"
              className="md:hidden h-10 w-10 grid place-items-center rounded-md hover:bg-secondary/50"
              aria-label="Open search"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" className="stroke-black/80" fill="none" strokeWidth="1.5" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="currentColor" />
                <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeLinecap="round" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
