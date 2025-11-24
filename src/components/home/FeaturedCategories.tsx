"use client";

import Image from "next/image";
import Link from "next/link";
import type { CategoryCard } from "@/types/home";

export default function FeaturedCategories({ items }: { items: CategoryCard[] }) {
  if (!items || items.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight uppercase">Featured Categories</h2>
          <p className="text-sm text-muted">Curated themes to jump back into the catalog faster.</p>
        </div>
        <Link href="/catalog" className="hidden sm:inline-flex text-sm font-semibold underline hover:no-underline">
          View all categories
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin-horizontal sm:grid sm:grid-cols-3 lg:grid-cols-6 sm:gap-6 sm:overflow-visible">
        {items.map((c) => (
          <Link
            key={c.id}
            href={c.slug ? `/catalog?category=${encodeURIComponent(c.slug)}` : "/catalog"}
            className="group block min-w-[11rem] rounded-xl overflow-hidden border border-border bg-white shadow-sm hover:shadow-lg transition-soft relative isolate"
          >
            <div className="relative h-36 bg-subtle overflow-hidden">
              {c.image ? (
                <Image
                  src={c.image}
                  alt={c.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="h-full w-full grid place-content-center text-xs text-muted bg-subtle">No image</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/15 to-transparent group-hover:from-black/55 group-hover:via-black/25 transition" />
            </div>
            <div className="absolute top-3 left-3 inline-flex items-center rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-gray-900 border border-border shadow-sm">
              Explore
            </div>
            <div className="p-3 text-left space-y-1 bg-white">
              <div className="text-sm font-semibold leading-snug text-gray-900">{c.name}</div>
              <div className="text-xs text-gray-600">Shop curated picks</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
