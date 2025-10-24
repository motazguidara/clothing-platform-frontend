"use client";

import Image from "next/image";
import Link from "next/link";
import type { HomePromotion } from "@/types/home";

export default function Promotions({ items }: { items: HomePromotion[] }) {
  if (!items || items.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-6 py-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((p, i) => (
          <Link key={i} href={p.href} className="group relative rounded overflow-hidden card-hover block">
            {p.image && (
              <Image
                src={p.image}
                alt={p.title}
                width={800}
                height={600}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="h-56 w-full object-cover img-zoom"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
              {p.badge && (
                <div className="mb-2 text-xs font-semibold text-emerald-300">{p.badge}</div>
              )}
              <div className="text-lg font-semibold">{p.title}</div>
              {p.subtitle && <div className="text-sm opacity-90">{p.subtitle}</div>}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
