import CollectionRail from "@/components/CollectionRail";
import ApiStatus from "@/components/ApiStatus";
import { fetchHome } from "@/lib/api/home";
import HomeHero from "@/components/home/HomeHero";
import Promotions from "@/components/home/Promotions";
import FeaturedCategories from "@/components/home/FeaturedCategories";

export default async function Home() {
  const home = await fetchHome().catch(() => null);
  return (
    <div className="font-sans">
      <ApiStatus />
      {home?.hero ? <HomeHero hero={home.hero} /> : null}
      {home?.promotions?.length ? <Promotions items={home.promotions} /> : null}
      {home?.featured_categories?.length ? (
        <FeaturedCategories items={home.featured_categories} />
      ) : null}

      {/* Product rails (keep dynamic and cache-friendly) */}
      <CollectionRail title="Featured Collections" params={{ featured: true, ordering: "-created_at" }} href="/catalog?featured=true" />
      <CollectionRail title="Best Sellers" params={{ ordering: "-bestseller" }} href="/catalog?ordering=-bestseller" />
      <CollectionRail title="New Arrivals" params={{ ordering: "-created_at" }} href="/catalog?ordering=-created_at" />
    </div>
  );
}
