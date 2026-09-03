import API from "./axios";

// =========================
// ADMIN PRODUCT APIS
// =========================

export const createProduct = (data) => API.post("/admin/products", data);

export const getAdminProducts = (params = {}) =>
  API.get("/admin/products", { params });

export const getProductById = (id) => API.get(`/admin/products/id/${id}`);

export const updateProduct = (id, data) => API.put(`/admin/products/${id}`, data);

export const toggleProductActive = (id) =>
  API.patch(`/admin/products/${id}/toggle-active`);

export const toggleProductFeatured = (id) =>
  API.patch(`/admin/products/${id}/toggle-featured`);

export const deleteProduct = (id) => API.delete(`/admin/products/${id}`);

// =========================
// CLIENT PRODUCT APIS
// =========================

export const getProducts = (params = {}) =>
  API.get("/client/products", { params });

export const getProduct = (slug) => API.get(`/client/products/${slug}`);

export const getProductsByCategory = (slug, params = {}) =>
  API.get(`/client/products/category/${slug}`, { params });

export const getFeaturedShowcase = () =>
  API.get("/client/categories/featured-showcase");

export const getHomeShowcase = () =>
  API.get("/client/products/home-showcase");

export const getRelatedProducts = (id) =>
  API.get(`/client/products/related/${id}`);
