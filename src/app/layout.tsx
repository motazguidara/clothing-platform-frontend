import '@/polyfills/global-self';
import '@/polyfills/safeRepeat';
import './globals.css';
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import Header from "@/components/header";
import Footer from "@/components/Footer";
import { QueryProvider } from "@/providers/query-provider";
import { CartDrawer } from "@/components/CartDrawer";
import FilterDrawer from "@/components/FilterDrawer";
import { ToastProvider } from "@/providers/toast-provider";
import SearchOverlay from "@/components/SearchOverlay";
import ErrorBoundary from "@/components/error-boundary";
import { WishlistProvider } from "@/components/wishlist/wishlist-provider";
import AssistantWidgetProvider from "@/components/assistant-widget/AssistantWidget";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Optimize font loading
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false, // Only preload primary font
});

// Comprehensive metadata for SEO and social sharing
export const metadata: Metadata = {
  title: {
    template: "%s | Your Store",
    default: "Your Store - Premium Fashion & Lifestyle",
  },
  description: "Discover premium fashion and lifestyle products. Fast shipping, easy returns, and exceptional quality.",
  keywords: ["fashion", "clothing", "lifestyle", "premium", "online shopping", "e-commerce"],
  authors: [{ name: "Your Store Team" }],
  creator: "Your Store",
  publisher: "Your Store",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env["NEXT_PUBLIC_SITE_URL"] ?? 'https://yourstore.com'),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Your Store",
    title: "Your Store - Premium Fashion & Lifestyle",
    description: "Discover premium fashion and lifestyle products. Fast shipping, easy returns, and exceptional quality.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Your Store - Premium Fashion",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@yourstore",
    creator: "@yourstore",
    title: "Your Store - Premium Fashion & Lifestyle",
    description: "Discover premium fashion and lifestyle products. Fast shipping, easy returns, and exceptional quality.",
    images: ["/twitter-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env["GOOGLE_SITE_VERIFICATION"],
    yandex: process.env["YANDEX_VERIFICATION"],
    yahoo: process.env["YAHOO_VERIFICATION"],
  },
};

// Viewport configuration for responsive design
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        
        {/* DNS prefetch for better performance */}
        <link rel="dns-prefetch" href="https://api.stripe.com" />
        <link rel="dns-prefetch" href="https://checkout.stripe.com" />
        
        {/* Favicon and app manifest */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Analytics and monitoring */}
        {process.env.NODE_ENV === 'production' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env["NEXT_PUBLIC_GA_ID"]}', {
                  page_title: document.title,
                  page_location: window.location.href
                });
              `
            }}
          />
        )}
      </head>
      <body className="antialiased bg-white text-gray-900 min-h-screen">
        {/* Skip to main content for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50"
        >
          Skip to main content
        </a>
        
        <ErrorBoundary>
          <QueryProvider>
            <ToastProvider>
              <WishlistProvider>
              {/* Header with navigation */}
              <Suspense fallback={<div className="h-16 bg-white border-b" />}>
                <Header />
              </Suspense>
              
              {/* Main content area */}
              <main id="main-content" className="relative pt-16 min-h-screen">
                {children}
              </main>
              
              {/* Footer */}
              <Suspense fallback={<div className="h-32 bg-gray-50" />}>
                <Footer />
              </Suspense>
              
              {/* Interactive overlays and drawers */}
              <Suspense fallback={null}>
                <CartDrawer />
                <FilterDrawer />
                <SearchOverlay />
                <AssistantWidgetProvider />
              </Suspense>
              </WishlistProvider>
            </ToastProvider>
          </QueryProvider>
        </ErrorBoundary>
        
        {/* Initialize monitoring in production */}
        {process.env.NODE_ENV === 'production' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if (typeof window !== 'undefined') {
                  window.monitoring = ${JSON.stringify({ initialized: true })};
                }
              `
            }}
          />
        )}
      </body>
    </html>
  );
}
