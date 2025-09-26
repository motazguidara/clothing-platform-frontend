import Hero from "@/components/Hero";
import CollectionRail from "@/components/CollectionRail";
import ApiStatus from "@/components/ApiStatus";

export default function Home() {
  return (
    <div className="font-sans">
      <ApiStatus />
      <Hero />
      <CollectionRail title="Featured Collections" params={{ featured: true, ordering: "-created_at" }} href="/catalog?featured=true" />
      <CollectionRail title="Best Sellers" params={{ ordering: "-bestseller" }} href="/catalog?ordering=-bestseller" />
      <CollectionRail title="New Arrivals" params={{ ordering: "-created_at" }} href="/catalog?ordering=-created_at" />
    </div>
  );
}
