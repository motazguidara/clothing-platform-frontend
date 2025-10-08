"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import type { HomeHero as THero } from "@/types/home";

export default function HomeHero({ hero }: { hero: THero }) {
  const bg = hero.bg_image || "/globe.svg";
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        {bg && (
          // Decorative background image
          <Image src={bg} alt="" fill priority className="object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-white/20 to-white/60" />
      </div>
      <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24">
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="text-4xl sm:text-5xl lg:text-6xl font-extrabold uppercase tracking-tight"
        >
          {hero.headline}
        </motion.h1>
        {hero.subheadline && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
            className="mt-4 max-w-2xl text-base sm:text-lg text-muted"
          >
            {hero.subheadline}
          </motion.p>
        )}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
          className="mt-8 flex gap-3"
        >
          {hero.primary_cta_href && hero.primary_cta_label && (
            <Link
              href={hero.primary_cta_href}
              className="inline-flex items-center justify-center rounded-md bg-black text-white px-6 py-3 text-sm font-semibold hover:bg-black/90 transition"
            >
              {hero.primary_cta_label}
            </Link>
          )}
          {hero.secondary_cta_href && hero.secondary_cta_label && (
            <Link
              href={hero.secondary_cta_href}
              className="inline-flex items-center justify-center rounded-md border border-foreground px-6 py-3 text-sm font-semibold hover:bg-foreground hover:text-white transition"
            >
              {hero.secondary_cta_label}
            </Link>
          )}
        </motion.div>
      </div>
    </section>
  );
}
