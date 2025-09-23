import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/header";
import { QueryProvider } from "@/providers/query-provider";
import { CartDrawer } from "@/components/CartDrawer";
import FilterDrawer from "@/components/FilterDrawer";
import { ToastProvider } from "@/providers/toast-provider";
import SearchOverlay from "@/components/SearchOverlay";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Clothing — Minimal High-Contrast Store",
  description:
    "Bold, image-first e-commerce frontend built with Next.js and Tailwind.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        <QueryProvider>
          <ToastProvider>
            <Header />
            <CartDrawer />
            <FilterDrawer />
            <SearchOverlay />
            <main className="relative pt-20">{children}</main>
          </ToastProvider>
        </QueryProvider>
        <footer className="mt-24 border-t border-border py-8 text-sm text-muted">
          <div className="max-w-7xl mx-auto px-6">
            © {new Date().getFullYear()} Clothing. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  );
}
