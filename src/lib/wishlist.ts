import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { apiClient } from './api/client';
import { clientEnv } from './env';

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

// Storage key for anonymous users
const ANONYMOUS_STORAGE_KEY = 'anonymous_wishlist';

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
          const response = await apiClient.get<{ results?: any[]; count?: number }>('/catalog/wishlist/?page_size=200');
          const results = Array.isArray((response as any)?.results) ? (response as any).results : [];

          const nowIso = new Date().toISOString();
          const items: WishlistItem[] = results.map((product: any) => {
            const primaryImage =
              Array.isArray(product?.images) && product.images.length > 0
                ? product.images[0]?.image ?? null
                : product?.image ?? null;
            const currentPrice =
              typeof product?.current_price === 'number'
                ? product.current_price
                : typeof product?.price === 'number'
                ? product.price
                : undefined;
            return {
              id: Number(product?.id) || Date.now() + Math.random(),
              productId: Number(product?.id),
              addedAt: product?.added_at || nowIso,
              name: product?.name,
              price: currentPrice,
              image: primaryImage,
              slug: product?.slug,
              brandName: product?.brand?.name,
              product,
            };
          });

          set((draft) => {
            draft.items = items;
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
            .get<{ results?: any[] }>('/catalog/wishlist/?page_size=200')
            .catch(() => ({ results: [] }));
          const serverIds = Array.isArray((serverSnapshot as any)?.results)
            ? new Set(
                ((serverSnapshot as any).results as any[]).map((product) =>
                  Number(product?.id)
                )
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
