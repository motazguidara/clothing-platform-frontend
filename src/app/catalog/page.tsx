import type { Metadata } from 'next';
import { OptimizedProductCard } from '@/components/ui/optimized-product-card';
import type { Product } from '@/types';

// Server Component for SEO and performance
interface CatalogPageProps {
  searchParams: {
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
  };
}

// Server-side data fetching
async function getProducts(searchParams: CatalogPageProps['searchParams']) {
  const params = new URLSearchParams();
  
  // Build query parameters
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });
  
  try {
    const res = await fetch(`${process.env["NEXT_PUBLIC_API_URL"]}/catalog/products/?${params.toString()}`, {
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

// Generate metadata for SEO
export async function generateMetadata({ searchParams }: CatalogPageProps): Promise<Metadata> {
  const { category, q } = searchParams;
  
  let title = 'Catalog | Your Store';
  let description = 'Explore our latest collection of products.';
  
  if (q) {
    title = `Search results for "${q}" | Your Store`;
    description = `Find products matching "${q}" in our catalog.`;
  } else if (category) {
    title = `${category.charAt(0).toUpperCase() + category.slice(1)} | Your Store`;
    description = `Shop our ${category} collection.`;
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
  const data = await getProducts(searchParams);
  const results = Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);
  const products: Product[] = results || [];
  const totalCount = typeof data?.count === 'number' ? data.count : products.length;

  // Generate structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: searchParams.q ? `Search results for "${searchParams.q}"` : 'Product Catalog',
    description: 'Browse our collection of products',
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
          image: product.images?.[0] || product.image,
          offers: {
            '@type': 'Offer',
            price: product.price,
            priceCurrency: 'USD',
            availability: product.in_stock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          },
        },
      })),
    },
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              {searchParams.q ? `Search results for "${searchParams.q}"` : 'Catalog'}
            </h1>
            <p className="text-gray-600 mt-2">
              {searchParams.q 
                ? `${totalCount} products found`
                : 'Explore our latest selection'
              }
            </p>
          </div>
        </div>

        {/* Products Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <OptimizedProductCard 
                key={product.id} 
                product={product}
                priority={products.indexOf(product) < 4} // Prioritize first 4 images
                showQuickAdd
                showWishlist
              />
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
        
        {/* Pagination */}
        {totalCount > products.length && (
          <div className="flex justify-center mt-12">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                Showing {products.length} of {totalCount} products
              </span>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
