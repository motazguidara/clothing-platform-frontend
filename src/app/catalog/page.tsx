import type { Metadata } from 'next';
import Link from 'next/link';
import ProductCard from '@/components/product-card';
import { FilterSidebar, SortSelect } from '@/components/filters/filter-sidebar';
import type { Product, CatalogFacetsResponse } from '@/types';

// Server Component for SEO and performance
interface CatalogSearchParams {
  category?: string;
  gender?: string;
  price_min?: string;
  price_max?: string;
  size?: string;
  color?: string;
  q?: string;
  ordering?: string;
  page?: string;
  sale?: string;
  in_stock?: string;
}

type CatalogPageProps = {
  searchParams: Promise<CatalogSearchParams>;
};

// Server-side data fetching
function buildCatalogParams(sp: CatalogSearchParams) {
  const params = new URLSearchParams();

  Object.entries(sp).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params.append(key, value);
  });

  return params;
}

async function getProducts(sp: CatalogSearchParams) {
  const params = buildCatalogParams(sp);
  const query = params.toString();
  
  try {
    const res = await fetch(`${process.env["NEXT_PUBLIC_API_URL"]}/catalog/products/${query ? `?${query}` : ''}`, {
      next: { revalidate: 300 }, // Revalidate every 5 minutes
    });
    
    if (!res.ok) {
      throw new Error('Failed to fetch products');
    }
    
    return res.json();
  } catch (error) {
    console.error('Error fetching products:', error);
    return { results: [], count: 0 };
  }
}

async function getCatalogFacets(sp: CatalogSearchParams): Promise<CatalogFacetsResponse | null> {
  const params = buildCatalogParams(sp);
  const query = params.toString();

  try {
    const res = await fetch(`${process.env["NEXT_PUBLIC_API_URL"]}/catalog/products/facets/${query ? `?${query}` : ''}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) {
      throw new Error('Failed to fetch catalog facets');
    }
    return res.json();
  } catch (error) {
    console.error('Error fetching catalog facets:', error);
    return null;
  }
}

// Generate metadata for SEO
export async function generateMetadata({ searchParams }: CatalogPageProps): Promise<Metadata> {
  const sp = await searchParams;
  const facets = await getCatalogFacets(sp);
  const summary = facets?.summary;
  const { category, q } = sp;
  
  let baseTitle = summary?.title ?? 'Catalog';
  if (!summary?.title) {
    if (q) {
      baseTitle = `Search results for "${q}"`;
    } else if (category) {
      baseTitle = `${category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ')}`;
    }
  }
  const title = `${baseTitle} | Your Store`;

  let description =
    summary?.subtitle ?? 'Explore our latest collection of products.';
  
  if (q) {
    description = summary?.subtitle ?? `Find products matching "${q}" in our catalog.`;
  } else if (category && !summary?.subtitle) {
    description = `Shop our ${category.replace(/-/g, ' ')} collection.`;
  }
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
  };
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const sp = await searchParams;
  const [data, facetsData] = await Promise.all([
    getProducts(sp),
    getCatalogFacets(sp),
  ]);
  const results = Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);
  const products: Product[] = results ?? [];
  const fallbackCount = typeof data?.count === 'number' ? data.count : products.length;
  const summary = facetsData?.summary;
  const filters = facetsData?.filters ?? [];
  const totalCount = typeof summary?.count === 'number' ? summary.count : fallbackCount;
  const titleText = summary?.title ?? (sp.q ? `Search results for "${sp.q}"` : 'Catalog');
  const subtitleText = summary?.subtitle ?? (sp.q ? `${totalCount} products found` : 'Explore our latest selection');
  const breadcrumbs = summary?.breadcrumbs ?? [];
  const subcategories = summary?.subcategories ?? [];
  const activeCategorySlug = summary?.category?.slug ?? sp.category ?? null;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: titleText,
    description: subtitleText,
    numberOfItems: totalCount,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: totalCount,
      itemListElement: products.slice(0, 10).map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: product.name,
          description: product.description,
          image: product.images?.[0] ?? product.image ?? undefined,
          offers: {
            '@type': 'Offer',
            price: product.price,
            priceCurrency: 'TND',
            availability: product.in_stock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          },
        },
      })),
    },
  };

  const createHref = (overrides: Record<string, string | null | undefined>) => {
    const params = new URLSearchParams();

    Object.entries(sp).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      if (key === 'page') return;
      params.set(key, value);
    });

    Object.entries(overrides).forEach(([key, value]) => {
      if (value === undefined) return;
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    const query = params.toString();
    return `/catalog${query ? `?${query}` : ''}`;
  };

  // Generate structured data for SEO
  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="mb-8 space-y-4">
          {breadcrumbs.length > 0 && (
            <nav className="text-sm text-gray-500">
              <div className="flex flex-wrap items-center gap-2">
                <Link href="/catalog" className="hover:underline">
                  Catalog
                </Link>
                {breadcrumbs.map((crumb, index) => (
                  <span key={`${crumb.slug ?? crumb.id ?? index}`} className="flex items-center gap-2">
                    <span className="text-gray-300">/</span>
                    {crumb.slug && index !== breadcrumbs.length - 1 ? (
                      <Link href={createHref({ category: crumb.slug })} className="hover:underline">
                        {crumb.name}
                      </Link>
                    ) : (
                      <span className="text-gray-600">{crumb.name}</span>
                    )}
                  </span>
                ))}
              </div>
            </nav>
          )}

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                  {totalCount ? `${titleText} (${totalCount})` : titleText}
                </h1>
                <p className="text-gray-600 mt-2">{subtitleText}</p>
              </div>
              <SortSelect />
            </div>

            {subcategories.length > 0 && (
              <div className="flex flex-wrap gap-3 text-sm font-medium text-gray-700 lg:hidden">
                {subcategories.map((subcategory) => {
                  const slug = subcategory.slug ?? '';
                  const isActive = activeCategorySlug === slug;
                  return (
                    <Link
                      key={`${subcategory.id}-${slug}`}
                      href={createHref({ category: slug })}
                      className={`hover:underline ${isActive ? 'text-gray-900 font-semibold' : ''}`}
                    >
                      {subcategory.name}
                      {subcategory.product_count != null ? ` (${subcategory.product_count})` : ''}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-3 lg:sticky lg:top-24 lg:self-start max-lg:order-2">
            <div className="lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto pr-1 space-y-6">
              {subcategories.length > 0 && (
                <div className="hidden lg:block">
                  <div className="text-sm font-semibold text-gray-900 mb-3">Shop by Category</div>
                  <div className="space-y-2 text-sm">
                    {subcategories.map((subcategory) => {
                      const slug = subcategory.slug ?? '';
                      const isActive = activeCategorySlug === slug;
                      return (
                        <Link
                          key={`${subcategory.id}-${slug}`}
                          href={createHref({ category: slug })}
                          className={`block hover:underline ${isActive ? 'font-semibold text-gray-900' : 'text-gray-700'}`}
                        >
                          {subcategory.name}
                          {subcategory.product_count != null ? ` (${subcategory.product_count})` : ''}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
              <FilterSidebar filters={filters} />
            </div>
          </div>

          {/* Product Grid */}
          <div className="lg:col-span-9 min-h-[50vh]">
            {products.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-10 xl:gap-12">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600">Try adjusting your filters or search terms.</p>
              </div>
            )}

            {/* Pagination summary */}
            {totalCount > products.length && (
              <div className="flex justify-center mt-12">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    Showing {products.length} of {totalCount} products
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
