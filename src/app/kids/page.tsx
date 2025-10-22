import { KidsPageClient } from "./page.client";

type PageProps = {
  params: Promise<Record<string, never>>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function KidsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  return <KidsPageClient initialSearchParams={resolvedSearchParams} />;
}
