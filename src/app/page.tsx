export const revalidate = 0;

import CollectionRail from "@/components/CollectionRail";
import ApiStatus from "@/components/ApiStatus";
import { fetchHome } from "@/lib/api/home";
import { HomeHighlights } from "@/components/home/HomeHighlights";
import { HomeRecommendations } from "@/components/recommendations/HomeRecommendations";

export default async function Home() {
  const home = await fetchHome().catch(() => null);
  return (
    <div className="font-sans">
      <ApiStatus />
      <HomeHighlights initialData={home} />

      {/* Recommendations */}
      <HomeRecommendations />

      {/* Product rails (keep dynamic and cache-friendly) */}
      <CollectionRail
        title="Featured Collections"
        params={{ featured: true, ordering: "-created_at" }}
        href="/catalog?featured=true"
      />
      <CollectionRail
        title="New Arrivals"
        params={{ ordering: "-created_at" }}
        href="/catalog?ordering=-created_at"
      />
    </div>
  );
}
