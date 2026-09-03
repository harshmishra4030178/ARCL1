import {
  createEquipmentType,
  deleteEquipmentType,
  getAdminEquipmentTypes,
  getEquipmentTypes,
  reorderEquipmentTypes,
  toggleEquipmentTypeFeatured,
  toggleEquipmentTypeStatus,
  updateEquipmentType,
} from "../api/equipmentTypeApi.js";

export const equipmentTypeService = {
  // CLIENT GET ALL (100% PUBLIC - No Auth Required)
  getAll: async () => {
    const res = await getEquipmentTypes();
    return res.data?.data || res.data;
  },

  // ADMIN GET ALL (Protected)
  getAdminAll: async () => {
    const res = await getAdminEquipmentTypes();
    return res.data?.data || res.data;
  },

  // CREATE (Admin)
  create: async (data) => {
    const res = await createEquipmentType(data);
    return res.data?.data || res.data;
  },

  // UPDATE (Admin)
  update: async (id, data) => {
    const res = await updateEquipmentType(id, data);
    return res.data?.data || res.data;
  },

  // DELETE (Admin)
  remove: async (id) => {
    await deleteEquipmentType(id);
    return id;
  },

  // TOGGLE STATUS (Admin)
  toggle: async (id) => {
    const res = await toggleEquipmentTypeStatus(id);
    return res.data?.data || res.data;
  },

  // TOGGLE FEATURED (Admin)
  toggleFeatured: async (id) => {
    const res = await toggleEquipmentTypeFeatured(id);
    return res.data?.data || res.data;
  },

  // REORDER (Admin)
  reorder: async (data) => {
    const res = await reorderEquipmentTypes(data);
    return res.data?.data || res.data;
  },
};