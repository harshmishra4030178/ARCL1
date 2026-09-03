import { create } from "zustand";
import { toast } from "react-toastify";

const STORAGE_KEY = "arcl_quote_basket";

const getSavedItems = () => {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error("Failed to load quote basket from localStorage:", e);
    return [];
  }
};

const saveItems = (items) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error("Failed to save quote basket to localStorage:", e);
  }
};

export const useQuoteCartStore = create((set, get) => ({
  items: getSavedItems(),
  isOpen: false,

  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

  // ADD ITEM TO BASKET
  addItem: (product, quantity = 1) => {
    if (!product || !product._id) return;

    const currentItems = get().items;
    const existingIndex = currentItems.findIndex(
      (item) => item.product._id === product._id
    );

    let updatedItems;
    if (existingIndex > -1) {
      updatedItems = [...currentItems];
      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        quantity: updatedItems[existingIndex].quantity + (quantity || 1),
      };
      toast.info(
        `Updated quantity for ${product.name} in Quote Basket (${updatedItems[existingIndex].quantity} Units)`
      );
    } else {
      const newItem = {
        product: {
          _id: product._id,
          name: product.name,
          slug: product.slug,
          productCode: product.productCode || "",
          hsnCode: product.hsnCode || "",
          category: product.category?.name || product.category || "",
          images: product.images || [],
        },
        quantity: Math.max(1, quantity || 1),
      };
      updatedItems = [...currentItems, newItem];
      toast.success(
        `Added "${product.name}" to Quote Basket! 📋`
      );
    }

    saveItems(updatedItems);
    set({ items: updatedItems });
  },

  // REMOVE ITEM
  removeItem: (productId) => {
    const currentItems = get().items;
    const itemToRemove = currentItems.find((i) => i.product._id === productId);
    const updatedItems = currentItems.filter(
      (item) => item.product._id !== productId
    );

    saveItems(updatedItems);
    set({ items: updatedItems });

    if (itemToRemove) {
      toast.info(`Removed "${itemToRemove.product.name}" from Quote Basket`);
    }
  },

  // UPDATE QUANTITY
  updateQuantity: (productId, quantity) => {
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) return;

    const currentItems = get().items;
    const updatedItems = currentItems.map((item) => {
      if (item.product._id === productId) {
        return { ...item, quantity: qty };
      }
      return item;
    });

    saveItems(updatedItems);
    set({ items: updatedItems });
  },

  // CLEAR ALL
  clearCart: () => {
    saveItems([]);
    set({ items: [] });
  },

  // HELPER: IS IN CART
  isInCart: (productId) => {
    return get().items.some((item) => item.product._id === productId);
  },

  // HELPER: TOTAL DISTINCT ITEMS COUNT
  getItemCount: () => {
    return get().items.length;
  },

  // HELPER: TOTAL QUANTITY ACROSS ALL ITEMS
  getTotalQuantity: () => {
    return get().items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  },
}));
