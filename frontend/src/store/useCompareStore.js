import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "react-toastify";

export const useCompareStore = create(
  persist(
    (set, get) => ({
      items: [],
      isCompareModalOpen: false,

      // Add product to comparison (max 4 products)
      addToCompare: (product) => {
        if (!product || !product._id) return;
        const current = get().items;
        
        if (current.some((p) => p._id === product._id)) {
          toast.info(`${product.name} is already in comparison list.`);
          return;
        }

        if (current.length >= 4) {
          toast.warning("You can compare a maximum of 4 instruments at a time.");
          return;
        }

        set({ items: [...current, product] });
        toast.success(`Added ${product.name} to comparison! ⚖️`);
      },

      // Remove product
      removeFromCompare: (productId) => {
        const current = get().items;
        set({ items: current.filter((p) => p._id !== productId) });
      },

      // Toggle product
      toggleCompare: (product) => {
        if (!product || !product._id) return;
        const isPresent = get().items.some((p) => p._id === product._id);
        if (isPresent) {
          get().removeFromCompare(product._id);
        } else {
          get().addToCompare(product);
        }
      },

      // Clear all
      clearCompare: () => {
        set({ items: [] });
      },

      // Check if product is in compare
      isInCompare: (productId) => {
        return get().items.some((p) => p._id === productId);
      },

      // Modal controls
      openCompareModal: () => set({ isCompareModalOpen: true }),
      closeCompareModal: () => set({ isCompareModalOpen: false }),
    }),
    {
      name: "arcl_compare_store",
    }
  )
);
