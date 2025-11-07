import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { apiClient } from './api/client';

// Types
export interface WishlistItem {
  id: number;
  productId: number;
  variantId?: number;
  addedAt: string;
  // Product details for richer UI experiences
  name?: string;
  price?: number;
  image?: string | null;
  slug?: string;
  brandName?: string;
  product?: unknown;
}

export interface WishlistState {
  items: WishlistItem[];
  isLoading: boolean;
  error: string | null;
  lastSyncAt: string | null;
  isAuthenticated: boolean;
}

export interface WishlistActions {
  // Core actions
  addItem: (productId: number, variantId?: number) => Promise<void>;
  removeItem: (productId: number, variantId?: number) => Promise<void>;
  toggleItem: (productId: number, variantId?: number) => Promise<void>;
  clearWishlist: () => Promise<void>;
  
  // State management
  setItems: (items: WishlistItem[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  
  // Sync operations
  syncWithServer: () => Promise<void>;
  mergeAnonymousWishlist: () => Promise<void>;
  
  // Utilities
  hasItem: (productId: number, variantId?: number) => boolean;
  getItemCount: () => number;
  getItems: () => WishlistItem[];
}

export type WishlistStore = WishlistState & WishlistActions;

type WishlistApiProductResponse = {
  id?: number;
  product_id?: number;
  variant_id?: number | null;
  added_at?: string;
  name?: string;
  slug?: string;
  images?: Array<{ image?: string | null } | string | null>;
  image?: string | null;
  current_price?: number;
  price?: number;
  brand?: { name?: string | null } | null;
  product?: unknown;
};

type WishlistApiResponse = {
  results?: WishlistApiProductResponse[];
  count?: number;
};

// Create the store
export const useWishlistStore = create<WishlistStore>()(
  persist(
    immer((set, get) => ({
      // Initial state
      items: [],
      isLoading: false,
      error: null,
      lastSyncAt: null,
      isAuthenticated: false,

      // Core actions
      addItem: async (productId: number, variantId?: number) => {
        const state = get();
        
        // Check if item already exists
        if (state.hasItem(productId, variantId)) {
          return;
        }

        set((draft) => {
          draft.isLoading = true;
          draft.error = null;
        });

        try {
          if (state.isAuthenticated) {
            // Add to server
            await apiClient.post('/catalog/wishlist/toggle/', {
              product_id: productId,
              variant_id: variantId,
            });
            
            // Sync with server to get updated list
            await get().syncWithServer();
          } else {
            // Add to local storage
            const newItem: WishlistItem = {
              id: Date.now(), // Temporary ID for anonymous users
              productId,
              ...(variantId !== undefined ? { variantId } : {}),
              addedAt: new Date().toISOString(),
            };

            set((draft) => {
              draft.items.push(newItem);
            });
          }
        } catch (error) {
          set((draft) => {
            draft.error = error instanceof Error ? error.message : 'Failed to add item to wishlist';
          });
          throw error;
        } finally {
          set((draft) => {
            draft.isLoading = false;
          });
        }
      },

      removeItem: async (productId: number, variantId?: number) => {
        const state = get();
        
        set((draft) => {
          draft.isLoading = true;
          draft.error = null;
        });

        try {
          if (state.isAuthenticated) {
            // Remove from server
            await apiClient.post('/catalog/wishlist/toggle/', {
              product_id: productId,
              variant_id: variantId,
            });
            
            // Sync with server to get updated list
            await get().syncWithServer();
          } else {
            // Remove from local storage
            set((draft) => {
              draft.items = draft.items.filter(
                (item: WishlistItem) => !(item.productId === productId && item.variantId === variantId)
              );
            });
          }
        } catch (error) {
          set((draft) => {
            draft.error = error instanceof Error ? error.message : 'Failed to remove item from wishlist';
          });
          throw error;
        } finally {
          set((draft) => {
            draft.isLoading = false;
          });
        }
      },

      toggleItem: async (productId: number, variantId?: number) => {
        const state = get();
        
        if (state.hasItem(productId, variantId)) {
          await state.removeItem(productId, variantId);
        } else {
          await state.addItem(productId, variantId);
        }
      },

      clearWishlist: async () => {
        const state = get();
        
        set((draft) => {
          draft.isLoading = true;
          draft.error = null;
        });

        try {
          if (state.isAuthenticated) {
            // Clear server wishlist
            const promises = state.items.map((item: WishlistItem) =>
              apiClient.post('/catalog/wishlist/toggle/', {
                product_id: item.productId,
                variant_id: item.variantId,
              })
            );
            
            await Promise.all(promises);
          }
          
          // Clear local state
          set((draft) => {
            draft.items = [];
          });
        } catch (error) {
          set((draft) => {
            draft.error = error instanceof Error ? error.message : 'Failed to clear wishlist';
          });
          throw error;
        } finally {
          set((draft) => {
            draft.isLoading = false;
          });
        }
      },

      // State management
      setItems: (items: WishlistItem[]) => {
        set((draft) => {
          draft.items = items;
          draft.lastSyncAt = new Date().toISOString();
        });
      },

      setLoading: (loading: boolean) => {
        set((draft) => {
          draft.isLoading = loading;
        });
      },

      setError: (error: string | null) => {
        set((draft) => {
          draft.error = error;
        });
      },

      setAuthenticated: (authenticated: boolean) => {
        const wasAuthenticated = get().isAuthenticated;
        if (wasAuthenticated === authenticated) {
          return;
        }

        set((draft) => {
          draft.isAuthenticated = authenticated;
          if (!authenticated) {
            draft.items = [];
            draft.lastSyncAt = null;
          }
        });
      },

      // Sync operations
      syncWithServer: async () => {
        const state = get();
        
        if (!state.isAuthenticated) {
          return;
        }

        set((draft) => {
          draft.isLoading = true;
          draft.error = null;
        });

        try {
          // Fetch full wishlist products from server
          const response = await apiClient.get<WishlistApiResponse>('/catalog/wishlist/?page_size=200');
          const results = Array.isArray(response?.results) ? response.results : [];

          const nowIso = new Date().toISOString();
          const items = results
            .map((product) => {
              if (!product) {
                return null;
              }

              const rawProductId = product.product_id ?? product.id;
              const numericProductId =
                typeof rawProductId === 'number' ? rawProductId : Number(rawProductId);
              if (!Number.isFinite(numericProductId)) {
                return null;
              }

              const numericId =
                typeof product.id === 'number' ? product.id : Number(product.id ?? NaN);
              const safeId = Number.isFinite(numericId) ? numericId : Date.now() + Math.random();

              const galleryImage = Array.isArray(product.images)
                ? product.images
                    .map((entry) => {
                      if (typeof entry === 'string') {
                        return entry;
                      }
                      if (entry && typeof entry === 'object' && 'image' in entry) {
                        const imageValue = (entry as { image?: string | null }).image;
                        return typeof imageValue === 'string' ? imageValue : null;
                      }
                      return null;
                    })
                    .find((src): src is string => typeof src === 'string' && src.trim().length > 0)
                : null;

              const fallbackImage =
                typeof product.image === 'string' && product.image.trim().length > 0
                  ? product.image
                  : null;
              const resolvedImage = galleryImage ?? fallbackImage;
              const primaryImage =
                typeof resolvedImage === 'string' && resolvedImage.trim().length > 0
                  ? resolvedImage
                  : null;

              const currentPrice =
                typeof product.current_price === 'number'
                  ? product.current_price
                  : typeof product.price === 'number'
                  ? product.price
                  : undefined;

              return {
                id: safeId,
                productId: numericProductId,
                addedAt: product.added_at ?? nowIso,
                name: product.name,
                price: currentPrice,
                image: primaryImage,
                slug: product.slug,
                brandName: product.brand?.name ?? undefined,
                product: product.product ?? product,
              };
            })
            .filter((item): item is NonNullable<typeof item> => item !== null);

          set((draft) => {
            draft.items = items as WishlistItem[];
            draft.lastSyncAt = new Date().toISOString();
          });
        } catch (error) {
          set((draft) => {
            draft.error = error instanceof Error ? error.message : 'Failed to sync with server';
          });
          throw error;
        } finally {
          set((draft) => {
            draft.isLoading = false;
          });
        }
      },

      mergeAnonymousWishlist: async () => {
        const state = get();
        
        if (!state.isAuthenticated || state.items.length === 0) {
          return;
        }

        set((draft) => {
          draft.isLoading = true;
          draft.error = null;
        });

        try {
          // Load server wishlist first to avoid removing existing items
          const serverSnapshot = await apiClient
            .get<WishlistApiResponse>('/catalog/wishlist/?page_size=200')
            .catch(() => ({ results: [] } as WishlistApiResponse));
          const serverIds = Array.isArray(serverSnapshot.results)
            ? new Set(
                serverSnapshot.results
                  .map((product) => {
                    const idCandidate = product?.id ?? product?.product_id;
                    const numericId =
                      typeof idCandidate === 'number' ? idCandidate : Number(idCandidate);
                    return Number.isFinite(numericId) ? numericId : null;
                  })
                  .filter((value): value is number => value !== null)
              )
            : new Set<number>();

          const pendingIds = state.items
            .map((item) => Number(item.productId))
            .filter((productId) => Number.isFinite(productId) && !serverIds.has(productId));

          if (pendingIds.length > 0) {
            await Promise.all(
              pendingIds.map((productId) =>
                apiClient
                  .post('/catalog/wishlist/toggle/', {
                    product_id: productId,
                  })
                  .catch(() => {
                    // Ignore individual failures during merge so the rest can succeed
                  })
              )
            );
          }
          
          await get().syncWithServer();
        } catch (error) {
          set((draft) => {
            draft.error = error instanceof Error ? error.message : 'Failed to merge wishlist';
          });
        } finally {
          set((draft) => {
            draft.isLoading = false;
          });
        }
      },

      // Utilities
      hasItem: (productId: number, variantId?: number) => {
        const state = get();
        return state.items.some(
          item => item.productId === productId && item.variantId === variantId
        );
      },

      getItemCount: () => {
        return get().items.length;
      },

      getItems: () => {
        return get().items;
      },
    })),
    {
      name: 'wishlist-storage',
      storage: createJSONStorage(() => {
        // Use different storage based on authentication status
        if (typeof window !== 'undefined') {
          return localStorage;
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      partialize: (state) => ({
        // Only persist items for anonymous users
        items: state.isAuthenticated ? [] : state.items,
        lastSyncAt: state.lastSyncAt,
      }),
      onRehydrateStorage: () => (state) => {
        // Initialize after rehydration - don't auto-check auth to avoid 401s on mount
        // Let the app's auth provider handle this instead
        if (state && typeof window !== 'undefined') {
          // Just mark as not authenticated initially; auth provider will update
          state.setAuthenticated(false);
        }
      },
    }
  )
);

// React hooks for easier usage
export const useWishlist = () => {
  const store = useWishlistStore();
  
  return {
    items: store.items,
    isLoading: store.isLoading,
    error: store.error,
    itemCount: store.getItemCount(),
    getItemCount: store.getItemCount,
    hasItem: store.hasItem,
    addItem: store.addItem,
    removeItem: store.removeItem,
    toggleItem: store.toggleItem,
    clearWishlist: store.clearWishlist,
  };
};

export const useWishlistItem = (productId: number, variantId?: number) => {
  const store = useWishlistStore();
  
  return {
    isInWishlist: store.hasItem(productId, variantId),
    isLoading: store.isLoading,
    toggle: () => store.toggleItem(productId, variantId),
    add: () => store.addItem(productId, variantId),
    remove: () => store.removeItem(productId, variantId),
  };
};

// Auth integration hook
export const useWishlistAuth = () => {
  const store = useWishlistStore();
  
  const handleLogin = async () => {
    store.setAuthenticated(true);
  };
  
  const handleLogout = () => {
    store.setAuthenticated(false);
  };
  
  return {
    handleLogin,
    handleLogout,
    syncWithServer: store.syncWithServer,
  };
};

// Export the store for external usage
export default useWishlistStore;
