import { create } from "zustand";
import { productService } from "../services/productService.js";

export const useProductStore = create((set, get) => ({
  // =========================
  // STATES
  // =========================
  products: [],
  adminProducts: [],
  product: null,
  featuredShowcase: [],
  homeShowcase: [],
  homeShowcaseLoading: false,
  loading: false,
  categoryProductsLoading: false,
  error: null,
  totalProducts: 0,
  categoryProducts: [],
  categoryData: null,

  // =========================
  // CLIENT: FETCH ULTRA-FAST STRUCTURED HOME SHOWCASE
  // =========================
  fetchHomeShowcase: async () => {
    const current = get().homeShowcase;
    if (current && current.length > 0) {
      // Background revalidate without blocking UI
      productService.getHomeShowcase().then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          set({ homeShowcase: data });
        }
      }).catch(() => {});
      return current;
    }

    try {
      set({ homeShowcaseLoading: true, error: null });
      const data = await productService.getHomeShowcase();
      const showcaseList = Array.isArray(data) ? data : [];
      set({
        homeShowcase: showcaseList,
        homeShowcaseLoading: false,
      });
      return showcaseList;
    } catch (err) {
      console.error("Fetch home showcase failed:", err);
      set({
        error: err.response?.data?.message || "Failed to load home showcase",
        homeShowcaseLoading: false,
      });
    }
  },

  // =========================
  // CLIENT: FETCH FEATURED SHOWCASE FOR HOME
  // =========================
  fetchFeaturedShowcase: async () => {
    try {
      set({ loading: true, error: null });
      const data = await productService.getFeaturedShowcase();
      set({
        featuredShowcase: Array.isArray(data) ? data : [],
        loading: false,
      });
      return data;
    } catch (err) {
      console.error("Fetch featured showcase failed:", err);
      set({
        error: err.response?.data?.message || "Failed to load featured showcase",
        loading: false,
      });
    }
  },

  // =========================
  // CLIENT: FETCH PRODUCTS BY CATEGORY
  // =========================
  fetchProductsByCategory: async (slug, params = {}) => {
    try {
      set({ categoryProductsLoading: true, categoryProductsError: null });
      const data = await productService.getByCategory(slug, params);

      set({
        categoryProducts: data?.products || [],
        categoryData: data?.category || null,
        categoryProductsLoading: false,
      });
      return data;
    } catch (err) {
      console.error("Fetch category products failed:", err);
      set({
        categoryProducts: [],
        categoryData: null,
        categoryProductsError:
          err.response?.data?.message || "Failed to fetch category products",
        categoryProductsLoading: false,
      });
    }
  },

  // =========================
  // CLIENT: FETCH ACTIVE PRODUCTS (Catalog)
  // =========================
  fetchProducts: async (params = {}) => {
    try {
      set({ loading: true, error: null });
      const data = await productService.getAll(params);
      const productList = Array.isArray(data) ? data : [];

      set({
        products: productList,
        totalProducts: productList.length,
        loading: false,
      });
    } catch (err) {
      console.error("Fetch products error:", err);
      set({
        error: err.response?.data?.message || "Failed to fetch products",
        loading: false,
      });
    }
  },

  // =========================
  // ADMIN: FETCH ALL PRODUCTS (Active + Inactive)
  // =========================
  fetchAdminProducts: async (params = {}) => {
    try {
      set({ loading: true, error: null });
      const data = await productService.getAdminAll(params);
      const productList = Array.isArray(data) ? data : [];

      set({
        adminProducts: productList,
        totalProducts: productList.length,
        loading: false,
      });
      return productList;
    } catch (err) {
      console.error("Fetch admin products error:", err);
      set({
        error: err.response?.data?.message || "Failed to fetch products",
        loading: false,
      });
    }
  },

  // =========================
  // FETCH SINGLE PRODUCT (Slug)
  // =========================
  fetchSingleProduct: async (slug) => {
    try {
      set({ loading: true, error: null });
      const data = await productService.getOne(slug);
      set({ product: data, loading: false });
      return data;
    } catch (err) {
      console.error("Fetch single product error:", err);
      set({
        error: err.response?.data?.message || "Failed to fetch product",
        loading: false,
      });
      throw err;
    }
  },

  // =========================
  // ADMIN: FETCH PRODUCT BY ID (Edit Form)
  // =========================
  fetchProductById: async (id) => {
    try {
      set({ loading: true, error: null });
      const data = await productService.getById(id);
      set({ product: data, loading: false });
      return data;
    } catch (err) {
      console.error("Fetch product by ID error:", err);
      set({
        error: err.response?.data?.message || "Failed to fetch product",
        loading: false,
      });
      throw err;
    }
  },

  // =========================
  // CREATE PRODUCT
  // =========================
  addProduct: async (payload) => {
    try {
      set({ loading: true, error: null });
      const newProduct = await productService.create(payload);

      set((state) => ({
        adminProducts: [newProduct, ...state.adminProducts],
        products: [newProduct, ...state.products],
        totalProducts: state.totalProducts + 1,
        loading: false,
      }));

      return newProduct;
    } catch (err) {
      console.error("Create product error:", err);
      set({
        error: err.response?.data?.message || "Failed to create product",
        loading: false,
      });
      throw err;
    }
  },

  // =========================
  // UPDATE PRODUCT
  // =========================
  editProduct: async (id, payload) => {
    try {
      set({ loading: true, error: null });
      const updated = await productService.update(id, payload);

      set((state) => ({
        adminProducts: state.adminProducts.map((p) =>
          p._id === id ? updated : p
        ),
        products: state.products.map((p) =>
          p._id === id ? updated : p
        ),
        product: updated,
        loading: false,
      }));

      return updated;
    } catch (err) {
      console.error("Update product error:", err);
      set({
        error: err.response?.data?.message || "Failed to update product",
        loading: false,
      });
      throw err;
    }
  },

  // =========================
  // TOGGLE PRODUCT ACTIVE STATUS
  // =========================
  toggleActive: async (id) => {
    try {
      const updated = await productService.toggleActive(id);

      set((state) => ({
        adminProducts: state.adminProducts.map((p) =>
          p._id === id ? { ...p, isActive: updated.isActive } : p
        ),
      }));

      return updated;
    } catch (err) {
      console.error("Toggle product active error:", err);
      throw err;
    }
  },

  // =========================
  // TOGGLE PRODUCT FEATURED STATUS
  // =========================
  toggleFeatured: async (id) => {
    try {
      const updated = await productService.toggleFeatured(id);

      set((state) => ({
        adminProducts: state.adminProducts.map((p) =>
          p._id === id ? { ...p, isFeatured: updated.isFeatured } : p
        ),
      }));

      return updated;
    } catch (err) {
      console.error("Toggle product featured error:", err);
      throw err;
    }
  },

  // =========================
  // DELETE PRODUCT
  // =========================
  removeProduct: async (id) => {
    try {
      set({ loading: true, error: null });
      await productService.remove(id);

      set((state) => ({
        adminProducts: state.adminProducts.filter((p) => p._id !== id),
        products: state.products.filter((p) => p._id !== id),
        totalProducts: Math.max(0, state.totalProducts - 1),
        loading: false,
      }));
    } catch (err) {
      console.error("Delete product error:", err);
      set({
        error: err.response?.data?.message || "Failed to delete product",
        loading: false,
      });
      throw err;
    }
  },

  // =========================
  // GENERATE PRODUCT QR CODE
  // =========================
  generateProductQr: async (id) => {
    try {
      const res = await productService.generateQr(id);
      const updatedProduct = res.data;

      set((state) => ({
        adminProducts: state.adminProducts.map((p) =>
          p._id === id ? { ...p, qrCode: res.qrCode || updatedProduct?.qrCode } : p
        ),
        product:
          state.product?._id === id
            ? { ...state.product, qrCode: res.qrCode || updatedProduct?.qrCode }
            : state.product,
      }));

      return res;
    } catch (err) {
      console.error("Generate QR code error:", err);
      throw err;
    }
  },

  // =========================
  // BULK GENERATE QR CODES
  // =========================
  generateBulkQr: async (force = false) => {
    try {
      const res = await productService.generateBulkQr(force);
      // Refresh admin products to load newly generated QR codes
      await get().fetchAdminProducts();
      return res;
    } catch (err) {
      console.error("Bulk generate QR error:", err);
      throw err;
    }
  },

  // =========================
  // CLEAR STATES
  // =========================
  clearProduct: () => set({ product: null }),
  clearError: () => set({ error: null }),
}));
