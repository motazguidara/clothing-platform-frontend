"use client";

import React from "react";
import Link from "next/link";
import { IconButton } from "@/components/ui/icon-button";
import { WishlistLink } from "@/components/ui/wishlist-link";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { UserRound, ChevronDown, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUIStore } from "@/store/ui";
import { useCart } from "@/hooks/useCart";
import { usePathname, useSearchParams } from "next/navigation";
import { SearchOverlay } from "@/components/search/search-overlay";
import type { User } from "@/hooks/useAuth";
import type { CartItem } from "@/hooks/useCart";
import type { NavigationMenu } from "@/types/navigation";

const STATIC_NAVIGATION_MENUS: NavigationMenu[] = [
  {
    id: -1,
    key: "women",
    title: "Women",
    order: 10,
    hero_title: "New Season Essentials",
    hero_subtitle: "Discover versatile layers and polished looks for every day.",
    hero_link: "/catalog?gender=women&ordering=-created_at",
    hero_image: null,
    entry_url: "/women",
    items: [
      { id: -101, label: "Women overview", url: "/women", category_slug: null, badge_text: null, badge_variant: "default" },
      { id: -102, label: "New in", url: "/catalog?gender=women&ordering=-created_at", category_slug: null, badge_text: "New", badge_variant: "new" },
      { id: -103, label: "Cashmere", url: "/catalog?gender=women&category=cashmere", category_slug: "cashmere", badge_text: null, badge_variant: "default" },
      { id: -104, label: "Jackets", url: "/catalog?gender=women&category=outerwear", category_slug: "outerwear", badge_text: null, badge_variant: "default" },
      { id: -105, label: "Sale", url: "/catalog?sale=1&gender=women", category_slug: null, badge_text: "%", badge_variant: "sale" },
      { id: -106, label: "Accessories & Shoes", url: "/catalog?gender=women&category=accessories", category_slug: "accessories", badge_text: "Trend", badge_variant: "trend" },
      { id: -107, label: "Young Fashion", url: "/catalog?gender=women&category=young-fashion", category_slug: "young-fashion", badge_text: "Trend", badge_variant: "trend" },
    ],
  },
  {
    id: -2,
    key: "men",
    title: "Men",
    order: 20,
    hero_title: "Built For Everyday",
    hero_subtitle: "Tailored staples and easy layers to refresh his wardrobe.",
    hero_link: "/catalog?gender=men&ordering=-created_at",
    hero_image: null,
    entry_url: "/men",
    items: [
      { id: -201, label: "Men overview", url: "/men", category_slug: null, badge_text: null, badge_variant: "default" },
      { id: -202, label: "New in", url: "/catalog?gender=men&ordering=-created_at", category_slug: null, badge_text: "New", badge_variant: "new" },
      { id: -203, label: "Coats & Jackets", url: "/catalog?gender=men&category=outerwear", category_slug: "outerwear", badge_text: null, badge_variant: "default" },
      { id: -204, label: "Clothing", url: "/catalog?gender=men", category_slug: null, badge_text: null, badge_variant: "default" },
      { id: -205, label: "Accessories & Shoes", url: "/catalog?gender=men&category=accessories", category_slug: "accessories", badge_text: null, badge_variant: "default" },
      { id: -206, label: "Sale", url: "/catalog?sale=1&gender=men", category_slug: null, badge_text: "%", badge_variant: "sale" },
    ],
  },
  {
    id: -3,
    key: "kids",
    title: "Kids",
    order: 30,
    hero_title: "Play Ready Styles",
    hero_subtitle: "Soft fabrics and durable pieces for every adventure.",
    hero_link: "/catalog?gender=kids&ordering=-created_at",
    hero_image: null,
    entry_url: "/kids",
    items: [
      { id: -301, label: "Kids overview", url: "/kids", category_slug: null, badge_text: null, badge_variant: "default" },
      { id: -302, label: "New in", url: "/catalog?gender=kids&ordering=-created_at", category_slug: null, badge_text: "New", badge_variant: "new" },
      { id: -303, label: "Girls", url: "/catalog?gender=kids&category=girls", category_slug: "girls", badge_text: null, badge_variant: "default" },
      { id: -304, label: "Boys", url: "/catalog?gender=kids&category=boys", category_slug: "boys", badge_text: null, badge_variant: "default" },
      { id: -305, label: "Baby", url: "/catalog?gender=kids&category=baby", category_slug: "baby", badge_text: null, badge_variant: "default" },
      { id: -306, label: "Accessories", url: "/catalog?gender=kids&category=accessories", category_slug: "accessories", badge_text: "Trend", badge_variant: "trend" },
    ],
  },
  {
    id: -4,
    key: "sale",
    title: "Sale",
    order: 40,
    hero_title: "Limited Time Offers",
    hero_subtitle: "Save on best-selling styles while stock lasts.",
    hero_link: "/catalog?sale=1",
    hero_image: null,
    entry_url: "/catalog?sale=1",
    items: [
      { id: -401, label: "All Sale", url: "/catalog?sale=1", category_slug: null, badge_text: "%", badge_variant: "sale" },
      { id: -402, label: "Women Sale", url: "/catalog?sale=1&gender=women", category_slug: null, badge_text: null, badge_variant: "sale" },
      { id: -403, label: "Men Sale", url: "/catalog?sale=1&gender=men", category_slug: null, badge_text: null, badge_variant: "sale" },
      { id: -404, label: "Kids Sale", url: "/catalog?sale=1&gender=kids", category_slug: null, badge_text: null, badge_variant: "sale" },
    ],
  },
];
export default function Header() {
  const [scrolled, setScrolled] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const openMenu = useUIStore((s) => s.openMenu);
  const closeMenu = useUIStore((s) => s.closeMenu);
  const isMenuOpen = useUIStore((s) => s.isMenuOpen);
  const [activeMegaMenuKey, setActiveMegaMenuKey] = React.useState<string | null>(null);
  
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
  const menusToRender = STATIC_NAVIGATION_MENUS;
  const activeMegaMenu = React.useMemo(
    () => menusToRender.find((menu) => menu.key === activeMegaMenuKey) ?? null,
    [menusToRender, activeMegaMenuKey]
  );
  const isMegaMenuOpen = Boolean(activeMegaMenu);
  const headerHeight = scrolled ? 56 : 80;
  const closeMegaMenu = React.useCallback(() => {
    setActiveMegaMenuKey(null);
  }, []);
  const toggleMegaMenu = React.useCallback(
    (key: string) => {
      setIsSearchOpen(false);
      setActiveMegaMenuKey((current) => (current === key ? null : key));
    },
    []
  );
  const handleMegaTriggerClick = React.useCallback(
    (key: string) => {
      if (!mounted) return;
      toggleMegaMenu(key);
    },
    [mounted, toggleMegaMenu]
  );
  const resolveBadgeClass = React.useCallback((variant: string | null | undefined) => {
    switch (variant) {
      case "new":
        return "ml-3 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800";
      case "sale":
        return "ml-3 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700";
      case "trend":
        return "ml-3 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800";
      case "info":
        return "ml-3 inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700";
      default:
        return "ml-3 inline-flex items-center rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700";
    }
  }, []);

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
    closeMegaMenu();
  }, [pathname, searchParams?.toString(), isSearchOpen, closeMegaMenu]);

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

  React.useEffect(() => {
    if (isMenuOpen && isMegaMenuOpen) {
      closeMegaMenu();
    }
  }, [isMenuOpen, isMegaMenuOpen, closeMegaMenu]);

  React.useEffect(() => {
    if (!isMegaMenuOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMegaMenu();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMegaMenuOpen, closeMegaMenu]);

  React.useEffect(() => {
    if (!isMegaMenuOpen) {
      if (!isMenuOpen) {
        document.body.style.overflow = "";
      }
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      if (!isMenuOpen) {
        document.body.style.overflow = previousOverflow;
      }
    };
  }, [isMegaMenuOpen, isMenuOpen]);

  return (
    <>
      <header className={`fixed inset-x-0 top-0 z-40 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-border ${scrolled ? "h-14" : "h-20"} transition-[height,background-color] duration-300`}>
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold tracking-tight uppercase">Clothing</Link>
            <nav className="hidden md:flex items-center gap-6 text-sm" aria-label="Main navigation">
              <Link href="/catalog?ordering=-created_at" className="underline-link transition-soft">New</Link>
              {menusToRender.map((menu) => {
                const isActive = activeMegaMenu?.key === menu.key;
                return (
                  <button
                    key={menu.key}
                    type="button"
                    onClick={() => handleMegaTriggerClick(menu.key)}
                    className={`inline-flex items-center gap-1 underline-link transition-soft ${isActive ? "text-black" : ""}`}
                    aria-haspopup="dialog"
                    aria-expanded={isActive}
                  >
                    {menu.title}
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${isActive ? "rotate-180" : "rotate-0"}`}
                      aria-hidden="true"
                    />
                  </button>
                );
              })}
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
      {activeMegaMenu && (
        <div className="fixed inset-0 z-40 hidden md:flex" role="dialog" aria-label={`${activeMegaMenu.title} menu`}>
          <div className="relative flex h-full w-full">
            <div className="relative flex h-full w-[35vw] min-w-[320px] max-w-4xl flex-col border-r border-border bg-white shadow-2xl">
              <button
                type="button"
                onClick={closeMegaMenu}
                className="absolute right-6 top-6 text-gray-500 transition-colors hover:text-gray-900"
                aria-label="Close navigation panel"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>

              <div className="mt-16 flex-1 overflow-y-auto px-8 pb-10">
                <div className="grid gap-10 md:grid-cols-[minmax(200px,1fr)_minmax(160px,0.9fr)]">
                  <div className="space-y-2">
                    {activeMegaMenu.items.length > 0 ? (
                      activeMegaMenu.items.map((item) => (
                        <Link
                          key={item.id}
                          href={item.url}
                          onClick={closeMegaMenu}
                          className="flex items-center justify-between py-2 text-lg font-medium text-gray-900 transition-colors hover:text-black"
                        >
                          <span>{item.label}</span>
                          {item.badge_text ? (
                            <span className={resolveBadgeClass(item.badge_variant)}>
                              {item.badge_text}
                            </span>
                          ) : null}
                        </Link>
                      ))
                    ) : (
                      <p className="py-2 text-sm text-gray-500">
                        Navigation items for this section are not configured yet.
                      </p>
                    )}

                    <div className="pt-8 text-sm text-gray-600">
                      <Link
                        href={activeMegaMenu.entry_url}
                        onClick={closeMegaMenu}
                        className="underline-link transition-soft"
                      >
                        Explore {activeMegaMenu.title}
                      </Link>
                    </div>

                    <div className="mt-8 space-y-4 text-sm text-gray-600">
                      <Link href="/profile" className="flex items-center gap-2 hover:text-gray-900" onClick={closeMegaMenu}>
                        <span className="font-medium">My Account</span>
                      </Link>
                      <Link href="/support" className="flex items-center gap-2 hover:text-gray-900" onClick={closeMegaMenu}>
                        <span>Customer service</span>
                      </Link>
                      <Link href="/app" className="flex items-center gap-2 hover:text-gray-900" onClick={closeMegaMenu}>
                        <span>App</span>
                      </Link>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between space-y-4">
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-neutral-100">
                      {activeMegaMenu.hero_image ? (
                        <img
                          src={activeMegaMenu.hero_image}
                          alt={activeMegaMenu.hero_title ?? activeMegaMenu.title}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-neutral-100 via-neutral-200 to-neutral-100" />
                      )}
                      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 via-black/10 to-transparent p-6 text-white">
                        <h3 className="text-xl font-semibold">
                          {activeMegaMenu.hero_title ?? activeMegaMenu.title}
                        </h3>
                        {activeMegaMenu.hero_subtitle ? (
                          <p className="mt-2 text-sm text-white/85">
                            {activeMegaMenu.hero_subtitle}
                          </p>
                        ) : null}
                        <div className="mt-4">
                          <Link
                            href={activeMegaMenu.hero_link || activeMegaMenu.entry_url}
                            onClick={closeMegaMenu}
                            className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-white"
                          >
                            Shop now
                          </Link>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-600">
                      <p className="font-semibold text-gray-900">Need help?</p>
                      <p className="mt-1">Call us at +216 76 432 000 or email support@clothing.com</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="flex-1 bg-black/30 transition-opacity hover:bg-black/40"
              aria-hidden="true"
              onClick={closeMegaMenu}
            />
          </div>
        </div>
      )}

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
                href="/catalog?ordering=-created_at"
                className="block py-3 text-lg font-medium hover:underline underline-offset-4 decoration-2 transition-colors"
                onClick={closeMenu}
              >
                New
              </Link>

              {menusToRender.map((menu) => (
                <div key={menu.key} className="space-y-2">
                  <Link
                    href={menu.entry_url}
                    className="block py-3 text-lg font-medium hover:underline underline-offset-4 decoration-2 transition-colors"
                    onClick={closeMenu}
                  >
                    {menu.title}
                  </Link>
                  {menu.items.length > 0 && (
                    <div className="space-y-1 pl-4 text-base">
                      {menu.items.map((item) => (
                        <Link
                          key={item.id}
                          href={item.url}
                          className="block py-1 text-gray-600 hover:text-gray-900 transition-colors"
                          onClick={closeMenu}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}

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
