"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24">
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="text-4xl sm:text-5xl lg:text-6xl font-extrabold uppercase tracking-tight"
        >
          New Season. Same Drive.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
          className="mt-4 max-w-2xl text-base sm:text-lg text-muted"
        >
          Engineered essentials in a minimal, high-contrast design. Built for performance.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
          className="mt-8 flex gap-3"
        >
          <Link
            href="/catalog"
            className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold hover:opacity-90 transition"
          >
            Shop Now
          </Link>
          <Link
            href="/catalog?featured=true"
            className="inline-flex items-center justify-center rounded-md border border-foreground px-6 py-3 text-sm font-semibold hover:bg-foreground hover:text-white transition"
          >
            Featured
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
