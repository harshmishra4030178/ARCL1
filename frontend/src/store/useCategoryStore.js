import { create } from "zustand";
import { categoryService } from "../services/categoryService.js";

export const useCategoryStore = create((set) => ({
  categories: [],
  adminCategories: [],
  selectedCategory: null,
  loading: false,
  error: null,

  // =========================
  // PUBLIC CLIENT: FETCH ALL ACTIVE CATEGORIES (No Auth Required)
  // =========================
  fetchCategories: async (params = {}) => {
    try {
      set({ loading: true, error: null });
      const data = await categoryService.getAll(params);
      const list = Array.isArray(data) ? data : data?.categories || [];

      set({
        categories: list,
        loading: false,
      });
      return list;
    } catch (err) {
      console.error("Fetch client categories error:", err);
      set({
        error: err?.message || "Failed to fetch categories",
        loading: false,
      });
    }
  },

  // =========================
  // ADMIN: FETCH ALL CATEGORIES
  // =========================
  fetchAdminCategories: async (params = {}) => {
    try {
      set({ loading: true, error: null });
      const data = await categoryService.getAdminAll(params);
      const list = Array.isArray(data) ? data : data?.categories || [];

      set({
        adminCategories: list,
        categories: list,
        loading: false,
      });
      return list;
    } catch (err) {
      console.error("Fetch admin categories error:", err);
      set({
        error: err?.message || "Failed to fetch categories",
        loading: false,
      });
    }
  },

  // =========================
  // FETCH SINGLE CATEGORY BY SLUG (Public)
  // =========================
  fetchCategoryBySlug: async (slug) => {
    try {
      set({ loading: true, error: null });
      const response = await categoryService.getOne(slug);
      const category = response?.category || response;
      set({ selectedCategory: category, loading: false });
      return category;
    } catch (err) {
      set({
        error: err?.message || "Failed to fetch category",
        loading: false,
      });
      throw err;
    }
  },

  // =========================
  // CREATE CATEGORY (Admin)
  // =========================
  addCategory: async (payload) => {
    try {
      set({ error: null });
      const response = await categoryService.create(payload);
      const newCategory = response?.category || response;

      set((state) => ({
        categories: [newCategory, ...state.categories],
        adminCategories: [newCategory, ...state.adminCategories],
      }));

      return newCategory;
    } catch (err) {
      set({
        error: err?.message || "Create category failed",
      });
      throw err;
    }
  },

  // =========================
  // UPDATE CATEGORY (Admin)
  // =========================
  editCategory: async (id, payload) => {
    try {
      set({ error: null });
      const response = await categoryService.update(id, payload);
      const updatedCategory = response?.category || response;

      set((state) => ({
        categories: state.categories.map((item) =>
          item._id === id ? { ...item, ...updatedCategory } : item
        ),
        adminCategories: state.adminCategories.map((item) =>
          item._id === id ? { ...item, ...updatedCategory } : item
        ),
      }));

      return updatedCategory;
    } catch (err) {
      set({
        error: err?.message || "Update category failed",
      });
      throw err;
    }
  },

  // =========================
  // DELETE CATEGORY (Admin)
  // =========================
  removeCategory: async (id) => {
    try {
      set({ error: null });
      await categoryService.remove(id);

      set((state) => ({
        categories: state.categories.filter((item) => item._id !== id),
        adminCategories: state.adminCategories.filter((item) => item._id !== id),
      }));
    } catch (err) {
      set({
        error: err?.message || "Delete category failed",
      });
      throw err;
    }
  },

  // =========================
  // TOGGLE ACTIVE (Admin)
  // =========================
  toggleActive: async (id) => {
    try {
      set({ error: null });
      const response = await categoryService.toggleActive(id);
      const updatedCategory = response?.category || response;

      set((state) => ({
        categories: state.categories.map((item) =>
          item._id === id ? { ...item, ...updatedCategory } : item
        ),
      }));

      return updatedCategory;
    } catch (err) {
      set({
        error: err?.message || "Toggle active failed",
      });
      throw err;
    }
  },

  // =========================
  // TOGGLE FEATURED (Admin)
  // =========================
  toggleFeatured: async (id) => {
    try {
      set({ error: null });
      const response = await categoryService.toggleFeatured(id);
      const updatedCategory = response?.category || response;

      set((state) => ({
        categories: state.categories.map((item) =>
          item._id === id ? { ...item, ...updatedCategory } : item
        ),
      }));

      return updatedCategory;
    } catch (err) {
      set({
        error: err?.message || "Toggle featured failed",
      });
      throw err;
    }
  },
}));
