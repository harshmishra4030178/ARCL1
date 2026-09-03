import API from "./axios";

// =========================
// ADMIN EQUIPMENT TYPE APIS
// =========================

export const getAdminEquipmentTypes = () => API.get("/admin/equipment-types");

export const getSingleEquipmentType = (id) =>
  API.get(`/admin/equipment-types/${id}`);

export const createEquipmentType = (data) =>
  API.post("/admin/equipment-types", data);

export const updateEquipmentType = (id, data) =>
  API.put(`/admin/equipment-types/${id}`, data);

export const deleteEquipmentType = (id) =>
  API.delete(`/admin/equipment-types/${id}`);

export const toggleEquipmentTypeStatus = (id) =>
  API.patch(`/admin/equipment-types/${id}/toggle`);

export const toggleEquipmentTypeFeatured = (id) =>
  API.patch(`/admin/equipment-types/${id}/toggle-featured`);

export const reorderEquipmentTypes = (data) =>
  API.put("/admin/equipment-types/reorder", data);

// =========================
// CLIENT EQUIPMENT TYPE APIS
// =========================

export const getEquipmentTypes = () => API.get("/client/equipment-types");

export const getEquipmentType = (slug) =>
  API.get(`/client/equipment-types/${slug}`);