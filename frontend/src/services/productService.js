import {
  getProducts,
  getProduct,
  getAdminProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductActive,
  toggleProductFeatured,
  getProductsByCategory,
  getFeaturedShowcase,
  getHomeShowcase,
  getRelatedProducts,
} from "../api/productApi.js";

export const productService = {
  // CLIENT GET ALL
  getAll: async (params = {}) => {
    const res = await getProducts(params);
    return res.data?.data || res.data;
  },

  // ADMIN GET ALL (Active + Inactive)
  getAdminAll: async (params = {}) => {
    const res = await getAdminProducts(params);
    return res.data?.data || res.data;
  },

  // CLIENT GET SINGLE BY SLUG
  getOne: async (slug) => {
    const res = await getProduct(slug);
    return res.data?.data || res.data;
  },

  // ADMIN GET SINGLE BY ID
  getById: async (id) => {
    const res = await getProductById(id);
    return res.data?.data || res.data;
  },

  // CLIENT GET BY CATEGORY
  getByCategory: async (slug, params = {}) => {
    try {
      const res = await getProductsByCategory(slug, params);
      return res.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return { success: true, category: null, products: [], count: 0 };
      }
      throw error;
    }
  },

  // CLIENT GET FEATURED SHOWCASE
  getFeaturedShowcase: async () => {
    const res = await getFeaturedShowcase();
    return res.data?.data || res.data;
  },

  // CLIENT GET ULTRA-FAST HOME SHOWCASE
  getHomeShowcase: async () => {
    const res = await getHomeShowcase();
    return res.data?.data || res.data;
  },

  // CLIENT GET RELATED PRODUCTS IN SAME EQUIPMENT TYPE
  getRelated: async (id) => {
    try {
      const res = await getRelatedProducts(id);
      return res.data?.data || res.data || [];
    } catch {
      return [];
    }
  },

  // CREATE PRODUCT
  create: async (payload) => {
    const res = await createProduct(payload);
    return res.data?.data || res.data;
  },

  // UPDATE PRODUCT
  update: async (id, payload) => {
    const res = await updateProduct(id, payload);
    return res.data?.data || res.data;
  },

  // DELETE PRODUCT
  remove: async (id) => {
    const res = await deleteProduct(id);
    return res.data;
  },

  // TOGGLE ACTIVE STATUS
  toggleActive: async (id) => {
    const res = await toggleProductActive(id);
    return res.data?.data || res.data;
  },

  // TOGGLE FEATURED STATUS
  toggleFeatured: async (id) => {
    const res = await toggleProductFeatured(id);
    return res.data?.data || res.data;
  },
};
