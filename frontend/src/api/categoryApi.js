import API from "./axios";

// =========================
// ADMIN CATEGORY APIS
// =========================

export const createCategory = (data) => API.post("/admin/categories", data);

export const getAdminCategories = (params = {}) =>
  API.get("/admin/categories", { params });

export const getCategoryById = (id) => API.get(`/admin/categories/id/${id}`);

export const getAdminCategoryBySlug = (slug) =>
  API.get(`/admin/categories/${slug}`);

export const updateCategory = (id, data) =>
  API.put(`/admin/categories/${id}`, data);

export const deleteCategory = (id) => API.delete(`/admin/categories/${id}`);

export const toggleCategoryActive = (id) =>
  API.patch(`/admin/categories/${id}/toggle`);

export const toggleCategoryFeatured = (id) =>
  API.patch(`/admin/categories/${id}/toggle-featured`);

// =========================
// CLIENT CATEGORY APIS
// =========================

export const getCategories = (params = {}) =>
  API.get("/client/categories", { params });

export const getCategory = (slug) => API.get(`/client/categories/${slug}`);

export const getCategoriesByEquipmentType = (slug) =>
  API.get(`/client/categories/equipment/${slug}`);