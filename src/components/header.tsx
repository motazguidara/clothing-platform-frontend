"use client";

import React from "react";
import Link from "next/link";
import { IconButton } from "@/components/ui/icon-button";
import { WishlistLink } from "@/components/ui/wishlist-link";
import { useAuth } from "@/hooks/useAuth";
import { useUIStore } from "@/store/ui";
import { useCart } from "@/hooks/useCart";

export default function Header() {
  const [scrolled, setScrolled] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const openMenu = useUIStore((s) => s.openMenu);
  const closeMenu = useUIStore((s) => s.closeMenu);
  const isMenuOpen = useUIStore((s) => s.isMenuOpen);
  
  const { data: cart } = useCart();
  const cartCount = React.useMemo(() => 
    (cart?.items ?? []).reduce((sum: number, it: any) => sum + (it.quantity || 1), 0),
    [cart?.items]
  );
  
  const displayCartCount = mounted ? cartCount : 0;
  const openCart = useUIStore((s) => s.openCart);
  const { isAuthenticated, hasProfile, user, isLoading } = useAuth({ fetchProfile: false });

  // Debug: log auth state from header
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('[Header] auth', { isAuthenticated, hasProfile, user: user ? { id: (user as any).id, email: (user as any).email } : null, loading: isLoading });
    }
  }, [isAuthenticated, hasProfile, user, isLoading]);

  // Handle scroll effect
  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 16);
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Set mounted state after component mounts
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Handle escape key to close mobile menu
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMenuOpen) {
        closeMenu();
      }
    };

    if (isMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen, closeMenu]);

  return (
    <>
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
              {!isAuthenticated && (
                <Link href="/login" className="px-3 py-2 rounded-md hover:bg-secondary/50 text-sm hidden md:block">Login</Link>
              )}
              {isAuthenticated && (
                <Link href="/profile" aria-label="Profile" className="px-3 py-2 rounded-md hover:bg-secondary/50 text-sm hidden md:block">Profile</Link>
              )}

              <WishlistLink size="sm" />

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

              {/* Mobile hamburger menu */}
              <button
                onClick={openMenu}
                className="md:hidden h-10 w-10 grid place-items-center rounded-md hover:bg-secondary/50"
                aria-label="Open menu"
                aria-expanded={isMenuOpen}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" className="stroke-black/80" fill="none" strokeWidth="1.5" aria-hidden="true">
                  {isMenuOpen ? (
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                  ) : (
                    <>
                      <path d="M4 6h16" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M4 12h16" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${
          isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeMenu}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Menu Panel */}
        <div
          className={`absolute top-0 left-0 h-full w-80 max-w-[85vw] bg-white shadow-xl transform transition-transform duration-300 ${
            isMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-8">
              <Link href="/" className="text-xl font-bold tracking-tight uppercase" onClick={closeMenu}>
                Clothing
              </Link>
              <button
                onClick={closeMenu}
                className="h-8 w-8 grid place-items-center rounded-md hover:bg-secondary/50"
                aria-label="Close menu"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" className="stroke-black/80" fill="none" strokeWidth="1.5" aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <nav className="space-y-6" aria-label="Mobile navigation">
              <Link
                href="/men"
                className="block py-3 text-lg font-medium hover:text-primary transition-colors"
                onClick={closeMenu}
              >
                Men
              </Link>
              <Link
                href="/women"
                className="block py-3 text-lg font-medium hover:text-primary transition-colors"
                onClick={closeMenu}
              >
                Women
              </Link>
              <Link
                href="/kids"
                className="block py-3 text-lg font-medium hover:text-primary transition-colors"
                onClick={closeMenu}
              >
                Kids
              </Link>
              <Link
                href="/catalog?sale=true"
                className="block py-3 text-lg font-medium hover:text-primary transition-colors"
                onClick={closeMenu}
              >
                Sale
              </Link>
              <Link
                href="/catalog"
                className="block py-3 text-lg font-medium hover:text-primary transition-colors"
                onClick={closeMenu}
              >
                All Products
              </Link>

              <hr className="my-6" />

              {!isAuthenticated && (
                <Link
                  href="/login"
                  className="block py-3 text-lg font-medium hover:text-primary transition-colors"
                  onClick={closeMenu}
                >
                  Login
                </Link>
              )}
              {isAuthenticated && (
                <Link
                  href="/profile"
                  className="block py-3 text-lg font-medium hover:text-primary transition-colors"
                  onClick={closeMenu}
                >
                  Profile
                </Link>
              )}
              <WishlistLink 
                className="block py-3 text-lg font-medium hover:text-primary transition-colors"
                onClick={closeMenu}
              />
              <Link
                href="/search"
                className="block py-3 text-lg font-medium hover:text-primary transition-colors"
                onClick={closeMenu}
              >
                Search
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}
