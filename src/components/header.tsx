"use client";

import React from "react";
import Link from "next/link";
import { IconButton } from "@/components/ui/icon-button";
import { WishlistLink } from "@/components/ui/wishlist-link";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { UserRound, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUIStore } from "@/store/ui";
import { useCart } from "@/hooks/useCart";
import { usePathname, useSearchParams } from "next/navigation";
import { SearchOverlay } from "@/components/search/search-overlay";
import type { User } from "@/hooks/useAuth";
import type { CartItem } from "@/hooks/useCart";

export default function Header() {
  const [scrolled, setScrolled] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const openMenu = useUIStore((s) => s.openMenu);
  const closeMenu = useUIStore((s) => s.closeMenu);
  const isMenuOpen = useUIStore((s) => s.isMenuOpen);
  
  const { data: cart } = useCart();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const cartCount = React.useMemo(() => {
    const items: CartItem[] = Array.isArray(cart?.items) ? (cart?.items as CartItem[]) : [];
    return items.reduce((sum: number, item) => {
      const rawQuantity = Number(item.quantity);
      const normalizedQuantity = Number.isFinite(rawQuantity) && rawQuantity > 0 ? rawQuantity : 1;
      return sum + normalizedQuantity;
    }, 0);
  }, [cart]);
  
  const displayCartCount = mounted ? cartCount : 0;
  const openCart = useUIStore((s) => s.openCart);
  const { isAuthenticated, hasProfile, user, isLoading, logout } = useAuth();
  const accountTriggerRef = React.useRef<HTMLButtonElement | null>(null);

  const accountDisplayName = React.useMemo(() => {
    const profile = user as User | undefined | null;
    const first = profile?.first_name?.trim() ?? '';
    const last = profile?.last_name?.trim() ?? '';
    const full = [first, last].filter(Boolean).join(' ').trim();
    if (full) return full;
    const emailHandle = profile?.email?.split('@')?.[0];
    return emailHandle && emailHandle.length > 0 ? emailHandle : 'Account';
  }, [user]);

  const handleLogout = React.useCallback(() => {
    logout();
  }, [logout]);

  const showAccountMenu = mounted && isAuthenticated;


  // Debug: log auth state from header
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('[Header] auth', { isAuthenticated, hasProfile, user: user ? { id: user.id, email: user.email } : null, loading: isLoading });
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

  // Close search overlay on route or query changes to ensure it never remains open after navigation
  React.useEffect(() => {
    if (isSearchOpen) setIsSearchOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams?.toString()]);

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
              <Link href="/catalog?ordering=-created_at" className="underline-link transition-soft">New</Link>
              <Link href="/men" className="underline-link transition-soft">Men</Link>
              <Link href="/women" className="underline-link transition-soft">Women</Link>
              <Link href="/kids" className="underline-link transition-soft">Kids</Link>
              <Link href="/catalog?category=sport" className="underline-link transition-soft">Sport</Link>
              <Link href="/catalog?sale=1" className="underline-link transition-soft">Sale</Link>
            </nav>
          </div>

          <div className="flex items-center gap-3 w-full justify-end">
            {/* Centered search pill */}
            <div className={`hidden md:flex flex-1 justify-center`}>
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="w-full max-w-md rounded-full bg-gray-100 shadow-inner px-4 py-2 flex items-center gap-2 text-sm hover:bg-gray-200 focus-visible:ring-2 ring-offset-2 ring-black cursor-pointer"
                aria-label="Open search"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" className="stroke-gray-500" fill="none" strokeWidth="1.5" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" />
                  <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeLinecap="round" />
                </svg>
                <span className="text-gray-600">Search</span>
              </button>
            </div>

            {/* Right icons */}
            <div className="flex items-center gap-2">
              {!showAccountMenu && (
                <Link href="/login" className="px-3 py-2 rounded-md text-sm hidden md:block underline-link transition-soft">Login</Link>
              )}
              {showAccountMenu && (
                <DropdownMenu
                  modal={false}
                  onOpenChange={(open) => {
                    if (!open) {
                      accountTriggerRef.current?.blur();
                    }
                  }}
                >
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      ref={accountTriggerRef}
                      className="hidden md:flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-900 transition-soft focus:outline-none focus:ring-0 cursor-pointer group"
                      aria-label="Open account menu"
                    >
                      <UserRound className="h-4 w-4 text-gray-600" aria-hidden="true" />
                      <span className="hidden lg:inline underline-link transition-soft group-hover:after:scale-x-100 group-focus-visible:after:scale-x-100">
                        Hi, {accountDisplayName}
                      </span>
                      <span className="lg:hidden underline-link transition-soft group-hover:after:scale-x-100 group-focus-visible:after:scale-x-100">
                        Account
                      </span>
                      <ChevronDown className="h-4 w-4 text-gray-600" aria-hidden="true" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 rounded-lg bg-white shadow-lg py-2 border-0 focus:outline-none "
                  >

                    <DropdownMenuItem
                      asChild
                      className="p-0  data-[highlighted]:bg-transparent "
                    >
                      <Link
                        href="/profile"
                        className="group block w-full px-4 py-2 text-sm font-medium  cursor-pointer"
                      >
                        <span className="inline-block w-fit underline-link transition-soft">Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      asChild
                      className="p-0 focus:bg-transparent data-[highlighted]:bg-transparent data-[highlighted]:text-gray-900"
                    >
                      <Link
                        href="/orders"
                        className="group block w-full px-4 py-2 text-sm font-medium  cursor-pointer"
                      >
                        <span className="inline-block w-fit underline-link transition-soft">Orders</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      asChild
                      className="p-0 focus:bg-transparent data-[highlighted]:bg-transparent data-[highlighted]:text-gray-900"
                    >
                      <Link
                        href="/wishlist"
                        className="group block w-full px-4 py-2 text-sm font-medium  cursor-pointer"
                      >
                        <span className="inline-block w-fit underline-link transition-soft">Favourites</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      asChild
                      className="p-0 focus:bg-transparent data-[highlighted]:bg-transparent data-[highlighted]:text-gray-900"
                    >
                      <Link
                        href="/profile"
                        className="group block w-full px-4 py-2 text-sm font-medium  cursor-pointer"
                      >
                        <span className="inline-block w-fit underline-link transition-soft">Account Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="px-4 py-2 text-sm font-medium text-red-600 focus:bg-transparent focus:outline-none transition-soft hover:text-red-700 text-left data-[highlighted]:bg-transparent data-[highlighted]:text-red-600 cursor-pointer"
                      onSelect={(event) => {
                        event.preventDefault();
                        handleLogout();
                      }}
                    >
                      <span className="inline-block w-fit underline-link transition-soft">Log Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className={`md:hidden h-10 w-10 grid place-items-center rounded-md hover:bg-secondary/50 cursor-pointer`}
                aria-label="Open search"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" className="stroke-black/80" fill="none" strokeWidth="1.5" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" />
                  <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeLinecap="round" />
                </svg>
              </button>

              {/* Mobile hamburger menu */}
              <button
                onClick={openMenu}
                className="md:hidden h-10 w-10 grid place-items-center rounded-md hover:bg-secondary/50 cursor-pointer"
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
      {/* Search Overlay (only navigates to /search on submit) */}
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

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
                className="block py-3 text-lg font-medium hover:underline underline-offset-4 decoration-2 transition-colors"
                onClick={closeMenu}
              >
                Men
              </Link>
              <Link
                href="/women"
                className="block py-3 text-lg font-medium hover:underline underline-offset-4 decoration-2 transition-colors"
                onClick={closeMenu}
              >
                Women
              </Link>
              <Link
                href="/kids"
                className="block py-3 text-lg font-medium hover:underline underline-offset-4 decoration-2 transition-colors"
                onClick={closeMenu}
              >
                Kids
              </Link>
              <Link
                href="/catalog?sale=true"
                className="block py-3 text-lg font-medium hover:underline underline-offset-4 decoration-2 transition-colors"
                onClick={closeMenu}
              >
                Sale
              </Link>
              <Link
                href="/catalog"
                className="block py-3 text-lg font-medium hover:underline underline-offset-4 decoration-2 transition-colors"
                onClick={closeMenu}
              >
                All Products
              </Link>

              <hr className="my-6" />

              {!showAccountMenu && (
                <Link
                  href="/login"
                  className="block py-3 text-lg font-medium hover:underline underline-offset-4 decoration-2 transition-colors"
                  onClick={closeMenu}
                >
                  Login
                </Link>
              )}
              {showAccountMenu && (
                <Link
                  href="/profile"
                  className="block py-3 text-lg font-medium hover:underline underline-offset-4 decoration-2 transition-colors"
                  onClick={closeMenu}
                >
                  Profile
                </Link>
              )}
              {showAccountMenu && (
                <Link
                  href="/orders"
                  className="block py-3 text-lg font-medium hover:underline underline-offset-4 decoration-2 transition-colors"
                  onClick={closeMenu}
                >
                  Orders
                </Link>
              )}
              <WishlistLink 
                className="block py-3 text-lg font-medium hover:underline underline-offset-4 decoration-2 transition-colors"
                onClick={closeMenu}
              />
              <Link
                href="/catalog?ordering=-created_at"
                className="block py-3 text-lg font-medium hover:underline underline-offset-4 decoration-2 transition-colors"
                onClick={closeMenu}
              >
                New
              </Link>
              <Link
                href="/catalog?category=sport"
                className="block py-3 text-lg font-medium hover:underline underline-offset-4 decoration-2 transition-colors"
                onClick={closeMenu}
              >
                Sport
              </Link>
              <Link
                href="/search"
                className="block py-3 text-lg font-medium hover:underline underline-offset-4 decoration-2 transition-colors"
                onClick={closeMenu}
              >
                Search
              </Link>
              {showAccountMenu && (
                <button
                  type="button"
                  onClick={() => {
                    closeMenu();
                    handleLogout();
                  }}
                  className="block w-full text-left py-3 text-lg font-medium text-red-600 hover:text-red-700 hover:underline underline-offset-4 decoration-2 transition-colors"
                >
                  Log Out
                </button>
              )}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}
