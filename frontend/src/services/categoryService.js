import {
  getCategories,
  getCategory,
  getAdminCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryActive,
  toggleCategoryFeatured,
} from "../api/categoryApi.js";

export const categoryService = {
  // CLIENT GET ALL (100% PUBLIC - No Auth Required)
  getAll: async (params = {}) => {
    const res = await getCategories(params);
    return res.data?.data || res.data;
  },

  // ADMIN GET ALL (Protected)
  getAdminAll: async (params = {}) => {
    const res = await getAdminCategories(params);
    return res.data?.data || res.data;
  },

  // GET SINGLE BY SLUG (Public)
  getOne: async (slug) => {
    const res = await getCategory(slug);
    return res.data?.data || res.data;
  },

  // GET SINGLE BY ID (Admin)
  getById: async (id) => {
    const res = await getCategoryById(id);
    return res.data?.data || res.data;
  },

  // CREATE (Admin)
  create: async (data) => {
    const res = await createCategory(data);
    return res.data?.data || res.data;
  },

  // UPDATE (Admin)
  update: async (id, data) => {
    const res = await updateCategory(id, data);
    return res.data?.data || res.data;
  },

  // DELETE (Admin)
  remove: async (id) => {
    await deleteCategory(id);
    return id;
  },

  // TOGGLE ACTIVE (Admin)
  toggleActive: async (id) => {
    const res = await toggleCategoryActive(id);
    return res.data?.data || res.data;
  },

  // TOGGLE FEATURED (Admin)
  toggleFeatured: async (id) => {
    const res = await toggleCategoryFeatured(id);
    return res.data?.data || res.data;
  },
};