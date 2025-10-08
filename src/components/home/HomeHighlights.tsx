"use client";

import React from "react";
import HomeHero from "@/components/home/HomeHero";
import Promotions from "@/components/home/Promotions";
import FeaturedCategories from "@/components/home/FeaturedCategories";
import type { HomePayload } from "@/types/home";
import { useHomeContent } from "@/hooks/useHomeContent";

interface HomeHighlightsProps {
  initialData?: HomePayload | null;
}

export function HomeHighlights({ initialData }: HomeHighlightsProps) {
  const { data, isFetching, error } = useHomeContent(initialData);
  const home = data ?? initialData ?? null;

  if (!home) {
    if (error) {
      return (
        <section className="mx-auto max-w-7xl px-6 py-10">
          <p className="text-sm text-red-600">Failed to load homepage content.</p>
        </section>
      );
    }
    return null;
  }

  const hasHero = Boolean(home.hero);
  const hasPromotions = Array.isArray(home.promotions) && home.promotions.length > 0;
  const hasFeaturedCategories = Array.isArray(home.featured_categories) && home.featured_categories.length > 0;

  if (!hasHero && !hasPromotions && !hasFeaturedCategories) {
    return null;
  }

  return (
    <div className="space-y-12">
      {hasHero ? <HomeHero hero={home.hero!} /> : null}
      {hasPromotions ? <Promotions items={home.promotions} /> : null}
      {hasFeaturedCategories ? (
        <FeaturedCategories items={home.featured_categories} />
      ) : null}
      {isFetching ? (
        <div className="mx-auto max-w-7xl px-6 text-xs text-muted">
          Updating homepage content...
        </div>
      ) : null}
    </div>
  );
}
