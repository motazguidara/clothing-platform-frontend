import { CategoryPageClient } from "./page.client";

type CategoryPageParams = { category: string };
type CategoryPageSearchParams = Record<string, string | string[] | undefined>;

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<CategoryPageParams>;
  searchParams: Promise<CategoryPageSearchParams>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const rawCategory = resolvedParams?.category ?? "";
  const category = decodeURIComponent(rawCategory);

  return <CategoryPageClient category={category} initialSearchParams={resolvedSearchParams} />;
}
