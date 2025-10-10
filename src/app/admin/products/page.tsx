"use client";

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useProducts } from "@/hooks/useCatalog";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  Search as IconSearch,
  X as IconX,
  Package as IconPackage,
  RefreshCw as IconRefresh,
  Loader2 as IconSpinner,
  CheckCircle as IconCheckCircle,
  EyeOff as IconEyeOff,
  Trash as IconTrash,
} from "lucide-react";
import type { Product } from "@/types";
import Image from "next/image";

// Extend Product type to include admin-specific fields
interface AdminProduct extends Omit<Product, 'category'> {
  status?: 'active' | 'inactive' | 'low_stock';
  stock_quantity?: number;
  images?: string[];
  // Category is optional in the admin interface
  category?: string;
}

// Type for the API response
interface ProductsResponse {
  results: AdminProduct[];
  count: number;
  next: string | null;
  previous: string | null;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const statusMap = {
    active: { label: 'Active', variant: 'default' as const },
    inactive: { label: 'Inactive', variant: 'default' as const },
    low_stock: { label: 'Low Stock', variant: 'destructive' as const },
  };

  const { label, variant } = statusMap[status as keyof typeof statusMap] || {
    label: status,
    variant: 'default' as const,
  };

  return <Badge variant={variant} className="capitalize">{label}</Badge>;
};

export default function AdminProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State for filters and pagination
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);
  
  // Debounce search query (define before buildParams to avoid TDZ)
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  
  // Build search parameters
  const buildParams = useCallback((): Record<string, string> => {
    const params: Record<string, string> = {};
    
    if (debouncedSearchQuery) params['q'] = debouncedSearchQuery;
    if (category) params['category'] = category;
    if (status) params['status'] = status;
    if (page > 1) params['page'] = page.toString();
    
    return params;
  }, [debouncedSearchQuery, category, status, page]);

  // Fetch products with current filters
  const { 
    data: productsData, 
    isLoading: isLoadingProducts, 
    isError: isProductsError 
  } = useProducts(buildParams());

  // (debouncedSearchQuery defined above)

  
  // Handle search input change
  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };
  
  // Handle product selection
  const handleSelectProduct = useCallback((productId: number) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  }, [productsData?.results]);
  
  // Handle bulk actions
  const handleBulkAction = useCallback(async (action: 'delete' | 'activate' | 'deactivate') => {
    if (selectedProducts.length === 0) return;

    setIsBulkActionLoading(true);
    
    try {
      // Implement bulk action logic here
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Success',
        description: `Successfully ${action}d ${selectedProducts.length} products`,
      });
      
      // Clear selection after action
      setSelectedProducts([]);
      
      // Refresh the product list
      // mutate();
    } catch (error) {
      console.error(`Failed to ${action} products:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${action} products. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setIsBulkActionLoading(false);
    }
  }, [selectedProducts.length, setIsBulkActionLoading]);
  
  // Handle edit product
  const handleEditProduct = useCallback((productId: number) => {
    router.push(`/admin/products/${productId}/edit`);
  }, [router]);
  
  const handleDeleteProduct = async (productId: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    // TODO: Wire to API
    toast({ title: 'Not implemented', description: `Delete product ${productId} coming soon.` });
  };

  // Handle select all products
  const handleSelectAll = useCallback(() => {
    if (selectedProducts.length === productsData?.results?.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(productsData?.results?.map((product) => product.id) || []);
    }
  }, [productsData?.results, selectedProducts.length]);

  const heroImages = useMemo(() => {
    const provided = Array.isArray(productsData?.heroImages)
      ? productsData.heroImages.filter((src): src is string => typeof src === "string" && src.trim().length > 0)
      : [];

    if (provided.length > 0) {
      return provided;
    }

    const fallback =
      productsData?.results
        ?.map((product) => {
          const primaryImage =
            (Array.isArray(product.images) && product.images.find((src) => typeof src === "string" && src.trim().length > 0)) ||
            (typeof product.image === "string" ? product.image : null);
          return typeof primaryImage === "string" ? primaryImage.trim() : null;
        })
        .filter((src): src is string => typeof src === "string" && src.length > 0) ?? [];

    return Array.from(new Set(fallback)).slice(0, 5);
  }, [productsData]);

  const heroTitle = productsData?.heroTitle ?? "Catalog spotlight";
  const heroSubtitle =
    productsData?.heroSubtitle ??
    (productsData
      ? `${productsData.count.toLocaleString("en-US")} products currently available`
      : "Stay on top of your product catalog and highlight what matters.");
  const heroCta = productsData?.heroCta ?? { label: "Add product", href: "/admin/products/new" };

  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

  useEffect(() => {
    setCurrentHeroIndex(0);
  }, [heroImages.length]);

  useEffect(() => {
    if (heroImages.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, 6000);

    return () => window.clearInterval(interval);
  }, [heroImages.length]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Products</h1>
              <p className="text-sm text-gray-600 mt-1">Manage your product catalog</p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">
                ← Back to Dashboard
              </Link>
              <Link
                href="/admin/products/new"
                className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition"
              >
                Add Product
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {heroImages.length > 0 && (
          <section className="mb-8">
            <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="relative h-60 sm:h-72 lg:h-80">
                {heroImages.map((src, index) => (
                  <div
                    key={`${src}-${index}`}
                    className="absolute inset-0 transition-opacity duration-700 ease-out"
                    style={{ opacity: currentHeroIndex === index ? 1 : 0 }}
                    aria-hidden={currentHeroIndex !== index}
                  >
                    <Image
                      src={src}
                      alt={`Hero slide ${index + 1}`}
                      fill
                      sizes="(min-width: 1024px) 960px, 100vw"
                      className="object-cover"
                      priority={index === 0}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/20 to-transparent" />
                  </div>
                ))}
              </div>
              <div className="relative z-10 flex flex-col gap-6 p-6 sm:p-8 lg:p-10">
                <div className="max-w-2xl text-white">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/80">Admin Spotlight</p>
                  <h2 className="mt-2 text-2xl sm:text-3xl font-bold">{heroTitle}</h2>
                  <p className="mt-3 text-sm sm:text-base text-white/80">{heroSubtitle}</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  {heroCta?.href && heroCta?.label ? (
                    <Link
                      href={heroCta.href}
                      className="inline-flex items-center rounded-md bg-white/90 px-4 py-2 text-sm font-semibold text-gray-900 shadow hover:bg-white transition"
                    >
                      {heroCta.label}
                    </Link>
                  ) : null}
                  {heroImages.length > 1 && (
                    <div className="flex items-center gap-2">
                      {heroImages.map((_, index) => (
                        <button
                          key={`dot-${index}`}
                          type="button"
                          onClick={() => setCurrentHeroIndex(index)}
                          className={`h-2.5 w-2.5 rounded-full transition ${
                            currentHeroIndex === index ? "bg-white" : "bg-white/50 hover:bg-white/70"
                          }`}
                          aria-label={`Show slide ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <IconSearch className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products by name, SKU..."
                  className="w-full pl-8"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select 
                value={category}
                onValueChange={setCategory}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  <SelectItem value="men">Men</SelectItem>
                  <SelectItem value="women">Women</SelectItem>
                  <SelectItem value="kids">Kids</SelectItem>
                </SelectContent>
              </Select>
              
              <Select 
                value={status}
                onValueChange={setStatus}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="low_stock">Low Stock</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="secondary" 
                onClick={() => {
                  setSearchQuery("");
                  setCategory("");
                  setStatus("");
                  setPage(1);
                }}
                disabled={!searchQuery && !category && !status}
              >
                <IconX className="mr-2 h-4 w-4" />
                Clear
              </Button>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedProducts.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center">
                <IconPackage className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-800">
                  {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => handleBulkAction('activate')}
                  disabled={isBulkActionLoading}
                >
                  {isBulkActionLoading ? (
                    <IconSpinner className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <IconCheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Activate
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => handleBulkAction('deactivate')}
                  disabled={isBulkActionLoading}
                >
                  {isBulkActionLoading ? (
                    <IconSpinner className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <IconEyeOff className="mr-2 h-4 w-4" />
                  )}
                  Deactivate
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete the selected products? This action cannot be undone.')) {
                      handleBulkAction('delete');
                    }
                  }}
                  disabled={isBulkActionLoading}
                >
                  {isBulkActionLoading ? (
                    <IconSpinner className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <IconTrash className="mr-2 h-4 w-4" />
                  )}
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={selectedProducts.length > 0 && selectedProducts.length === productsData?.results.length}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                      className="translate-y-[2px]"
                    />
                  </TableHead>
                  <TableHead className="min-w-[300px]">Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingProducts ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><div className="h-4 bg-muted rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-muted rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-muted rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-muted rounded animate-pulse w-16"></div></TableCell>
                      <TableCell><div className="h-4 bg-muted rounded animate-pulse w-12"></div></TableCell>
                      <TableCell><div className="h-4 bg-muted rounded animate-pulse w-20"></div></TableCell>
                      <TableCell className="text-right">
                        <div className="h-4 bg-muted rounded animate-pulse w-20 ml-auto"></div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : productsData?.results.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center py-8">
                        <IconPackage className="h-12 w-12 text-muted-foreground mb-2" />
                        <h3 className="text-lg font-medium">No products found</h3>
                        <p className="text-sm text-muted-foreground">
                          Try adjusting your search or filter to find what you're looking for.
                        </p>
                        <Button variant="secondary" className="mt-4" onClick={() => {
                          setSearchQuery('');
                          setCategory('');
                          setStatus('');
                          setPage(1);
                        }}>
                          <IconRefresh className="mr-2 h-4 w-4" />
                          Reset filters
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  productsData?.results.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={() => handleSelectProduct(product.id)}
                          aria-label={`Select ${product.name}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="h-10 w-10 rounded-md object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 bg-muted rounded-md flex items-center justify-center">
                              <IconPackage className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-foreground">{product.name}</div>
                            <div className="text-sm text-muted-foreground">SKU: {product.sku || 'N/A'}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">
                        {product.category || 'Uncategorized'}
                      </TableCell>
                      <TableCell>
                        ${product.price?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell>
                        {product.stock_quantity !== undefined ? (
                          <Badge
                            variant={product.stock_quantity > 10 ? 'default' : 'destructive'}
                            className="font-mono"
                          >
                            {product.stock_quantity} in stock
                          </Badge>
                        ) : (
                          <Badge variant="default">N/A</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={product.status || 'inactive'} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </Link>
                          <Link
                            href={`/product/${product.slug}`}
                            className="text-gray-600 hover:text-gray-900"
                            target="_blank"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoadingProducts && productsData && productsData.count > 20 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    Previous
                  </button>
                  <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">1</span> to <span className="font-medium">20</span> of{' '}
                      <span className="font-medium">{productsData.count}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                        Previous
                      </button>
                      <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                        1
                      </button>
                      <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                        2
                      </button>
                      <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Empty State */}
        {!isLoadingProducts && productsData?.results.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-4">Get started by adding your first product to the catalog.</p>
            <Link
              href="/admin/products/new"
              className="inline-flex items-center px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition"
            >
              Add Product
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
