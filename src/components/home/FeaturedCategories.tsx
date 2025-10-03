"use client";

import Image from "next/image";
import Link from "next/link";
import type { CategoryCard } from "@/types/home";

export default function FeaturedCategories({ items }: { items: CategoryCard[] }) {
  if (!items || items.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-4">
        <h2 className="text-xl font-semibold tracking-tight uppercase">Featured Categories</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
        {items.map((c) => (
          <Link key={c.id} href={`/catalog?category=${encodeURIComponent(c.slug)}`} className="group block card-hover rounded-md overflow-hidden">
            <div className="relative h-36 bg-subtle">
              {c.image && (
                <Image
                  src={c.image}
                  alt={c.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  className="object-cover img-zoom"
                />
              )}
            </div>
            <div className="p-2 text-center text-sm font-medium">{c.name}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
